import copy
import hashlib
import io

import pytest

from riddlex import blob_storage
from riddlex.career_site_routes import sniff_logo
from riddlex.errors import ApiError
from riddlex.schemas import validate_career_site

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
JPG = b"\xff\xd8\xff\xe0" + b"\x00" * 32
BASE = "/api/riddlex/_dev_files/riddlex-logos/"

VALID = {
    "companyName": "  Acme Corp ",
    "slug": " Acme-Corp ",
    "tagline": " Build things ",
    "logoUrl": "",
    "colors": {"primary": "#1A2B3C", "accent": "#FFAA00", "background": "#FFFFFF", "text": "#111111"},
    "font": "inter",
    "hiringLocations": [" Cairo ", "Riyadh", "Cairo", ""],
    "languages": ["fr", "en"],
    "defaultLanguage": "en",
    "published": True,
}


def make(**over):
    d = copy.deepcopy(VALID)
    d.update(over)
    return d


def msg(data, **kw):
    with pytest.raises(ApiError) as e:
        validate_career_site(data, **kw)
    assert e.value.status == 400
    return e.value.message


# ---------------------------------------------------------------- validate_career_site (no DB)
def test_valid_input_is_normalised():
    out = validate_career_site(make())
    assert out["companyName"] == "Acme Corp"
    assert out["slug"] == "acme-corp"
    assert out["tagline"] == "Build things"
    assert out["colors"] == {"primary": "#1a2b3c", "accent": "#ffaa00", "background": "#ffffff", "text": "#111111"}
    assert out["hiringLocations"] == ["Cairo", "Riyadh"]
    assert out["languages"] == ["en", "fr"]  # ordered per LANGUAGES
    assert out["published"] is True
    assert "updatedAt" not in out


@pytest.mark.parametrize("over,expected", [
    ({"companyName": " a "}, "Company name must be at least 2 characters."),
    ({"companyName": "x" * 121}, "Company name must be at most 120 characters."),
    ({"slug": "ab"}, "Career site URL must be 3-40 characters: lowercase letters, numbers and single hyphens."),
    ({"slug": "a" * 41}, "Career site URL must be 3-40 characters: lowercase letters, numbers and single hyphens."),
    ({"slug": "bad--slug"}, "Career site URL must be 3-40 characters: lowercase letters, numbers and single hyphens."),
    ({"slug": "-lead"}, "Career site URL must be 3-40 characters: lowercase letters, numbers and single hyphens."),
    ({"slug": "has space"}, "Career site URL must be 3-40 characters: lowercase letters, numbers and single hyphens."),
    ({"font": "comic-sans"}, "Choose a font from the list."),
    ({"font": None}, "Choose a font from the list."),
    ({"hiringLocations": []}, "Add at least one hiring location."),
    ({"hiringLocations": ["  ", ""]}, "Add at least one hiring location."),
    ({"hiringLocations": [f"c{i}" for i in range(26)]}, "Add at most 25 hiring locations."),
    ({"languages": []}, "Select at least one language."),
    ({"languages": ["de"]}, "Select at least one language."),
    ({"languages": ["en"], "defaultLanguage": "ar"}, "The default language must be one of the supported languages."),
    ({"tagline": "x" * 256}, "Tagline must be at most 255 characters."),
    ({"published": "yes"}, "Published must be true or false."),
])
def test_validation_rules(over, expected):
    assert msg(make(**over)) == expected


@pytest.mark.parametrize("name", ["primary", "accent", "background", "text"])
@pytest.mark.parametrize("bad", ["red", "#12345", "#gggggg", "123456", None])
def test_bad_colour(name, bad):
    colors = dict(VALID["colors"], **{name: bad})
    assert msg(make(colors=colors)) == f"The {name} color must be a hex value like #1a2b3c."


def test_slug_at_limits_ok():
    assert validate_career_site(make(slug="abc"))["slug"] == "abc"
    assert validate_career_site(make(slug="a" * 40))["slug"] == "a" * 40


def test_non_object_body():
    assert msg(None) == "Invalid request body."
    assert msg([1]) == "Invalid request body."


def test_logo_url_must_come_from_this_backend():
    ok = BASE + "logos/" + "a" * 64 + ".png"
    assert validate_career_site(make(logoUrl=ok), logo_base_url=BASE)["logoUrl"] == ok
    assert validate_career_site(make(logoUrl=""), logo_base_url=BASE)["logoUrl"] == ""
    for bad in (
        "https://evil.example/x.png",
        "data:image/png;base64,AAAA",
        BASE + "logos/../../x.png",
        BASE + "logos/short.png",
        BASE + "other/" + "a" * 64 + ".png",
        BASE + "logos/" + "a" * 64 + ".png?x=1",
    ):
        assert "logo" in msg(make(logoUrl=bad), logo_base_url=BASE)


def test_absent_logo_url_means_keep():
    data = make()
    del data["logoUrl"]
    assert validate_career_site(data, logo_base_url=BASE)["logoUrl"] is None
    assert validate_career_site(make(logoUrl=None))["logoUrl"] is None
    assert "logo" in msg(make(logoUrl=123))


# ---------------------------------------------------------------- logo sniffing (no DB)
def test_sniff_accepts_png_jpg_and_clean_svg():
    assert sniff_logo(PNG) == ("png", "image/png")
    assert sniff_logo(JPG) == ("jpg", "image/jpeg")
    assert sniff_logo(b'<svg xmlns="http://www.w3.org/2000/svg"><rect width="1"/></svg>') == ("svg", "image/svg+xml")
    assert sniff_logo(b'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="x"></svg>')[0] == "svg"


@pytest.mark.parametrize("data", [
    b"GIF89a....",
    b"%PDF-1.4",
    b"plain text",
    b"<html><svg></svg></html>",
    b"\xff\xfe\x00",
    b'<svg><script>alert(1)</script></svg>',
    b'<svg><SCRIPT>x</SCRIPT></svg>',
    b'<svg><a href="javascript:alert(1)"/></svg>',
    b'<svg><a href="&#106;avascript:alert(1)"/></svg>',
    b'<svg onload="x()"></svg>',
    b'<svg><rect onclick = "x()"/></svg>',
    b'<svg><foreignObject/></svg>',
    b'<svg xmlns:x="http://www.w3.org/2000/svg"><x:script>alert(1)</x:script></svg>',
    b'<svg><a href="java&#9;script:alert(1)"/></svg>',
    b'<svg><a xlink:href="java\nscript:alert(1)"/></svg>',
    b'<svg><a xlink:href="JavaScript:alert(1)"/></svg>',
    b'<svg/onload="x()"></svg>',
    b'<!DOCTYPE svg [<!ENTITY x "y">]><svg></svg>',
])
def test_sniff_rejects(data):
    assert sniff_logo(data) is None


# ---------------------------------------------------------------- blob_storage local mode (no DB)
@pytest.fixture
def local(tmp_path, monkeypatch):
    monkeypatch.delenv("AZURE_STORAGE_CONNECTION_STRING", raising=False)
    monkeypatch.setenv("RIDDLEX_STORAGE", "local")
    monkeypatch.setenv("RIDDLEX_LOCAL_DIR", str(tmp_path))
    monkeypatch.delenv("RIDDLEX_LOGO_CONTAINER", raising=False)
    monkeypatch.delenv("RIDDLEX_RESUME_CONTAINER", raising=False)
    return tmp_path


def test_local_upload_writes_and_returns_dev_url(local):
    url = blob_storage.upload("riddlex-logos", "logos/abc.png", PNG, "image/png")
    assert url == "/api/riddlex/_dev_files/riddlex-logos/logos/abc.png"
    assert (local / "riddlex-logos" / "logos" / "abc.png").read_bytes() == PNG
    # idempotent
    assert blob_storage.upload("riddlex-logos", "logos/abc.png", PNG, "image/png") == url


@pytest.mark.parametrize("path", ["../x", "a/../../x", "/etc/passwd", "a\\b", "", "a//b", "C:/x", "./a"])
def test_local_upload_rejects_traversal(local, path):
    with pytest.raises(ValueError):
        blob_storage.upload("riddlex-logos", path, b"x", "image/png")
    assert not (local.parent / "x").exists()


@pytest.mark.parametrize("container", ["..", "a/b", "", "../riddlex-logos"])
def test_local_upload_rejects_bad_container(local, container):
    with pytest.raises(ValueError):
        blob_storage.upload(container, "logos/a.png", b"x", "image/png")


def test_mode_selection(monkeypatch):
    monkeypatch.delenv("RIDDLEX_STORAGE", raising=False)
    monkeypatch.delenv("AZURE_STORAGE_CONNECTION_STRING", raising=False)
    assert blob_storage.is_local()
    monkeypatch.setenv("AZURE_STORAGE_CONNECTION_STRING", "UseDevelopmentStorage=true")
    assert not blob_storage.is_local()
    monkeypatch.setenv("RIDDLEX_STORAGE", "local")
    assert blob_storage.is_local()


def test_container_env_overrides(monkeypatch):
    monkeypatch.setenv("RIDDLEX_LOGO_CONTAINER", "l1")
    monkeypatch.setenv("RIDDLEX_RESUME_CONTAINER", "r1")
    assert (blob_storage.logo_container(), blob_storage.resume_container()) == ("l1", "r1")


def _dev_client():
    from flask import Flask

    app = Flask(__name__)
    from flask import Blueprint

    bp = Blueprint("t", __name__, url_prefix="/api/riddlex")
    blob_storage.register_dev_files(bp)
    app.register_blueprint(bp)
    return app.test_client()


def test_dev_route_serves_logos_only_and_blocks_traversal(local):
    blob_storage.upload("riddlex-logos", "logos/abc.png", PNG, "image/png")
    blob_storage.upload("riddlex-resumes", "cv/1.pdf", b"%PDF", "application/pdf")
    (local / "secret.txt").write_text("nope")
    c = _dev_client()
    r = c.get("/api/riddlex/_dev_files/riddlex-logos/logos/abc.png")
    assert r.status_code == 200 and r.data == PNG and r.mimetype == "image/png"
    assert r.headers["X-Content-Type-Options"] == "nosniff"
    # private container is not public
    assert c.get("/api/riddlex/_dev_files/riddlex-resumes/cv/1.pdf").status_code == 404
    # traversal attempts (raw and encoded)
    for p in ("../secret.txt", "..%2fsecret.txt", "logos/../../secret.txt", "%2e%2e/secret.txt"):
        assert c.get(f"/api/riddlex/_dev_files/riddlex-logos/{p}").status_code == 404
    assert c.get("/api/riddlex/_dev_files/riddlex-logos/logos/missing.png").status_code == 404


def test_dev_route_signed_download_url_for_private_container(local):
    blob_storage.upload("riddlex-resumes", "cv/1.pdf", b"%PDF", "application/pdf")
    c = _dev_client()
    url = blob_storage.download_url("riddlex-resumes", "cv/1.pdf")
    assert c.get(url).status_code == 200
    assert c.get(url[:-1] + ("0" if url[-1] != "0" else "1")).status_code == 404  # tampered sig
    assert c.get(url.split("?")[0]).status_code == 404  # unsigned
    assert c.get(url.split("&sig=")[0] + "&sig=%C3%A9").status_code == 404  # non-ASCII sig, not 500
    expired = blob_storage.download_url("riddlex-resumes", "cv/1.pdf", ttl_minutes=-1)
    assert c.get(expired).status_code == 404


# ---------------------------------------------------------------- routes (no DB)
def test_career_site_requires_auth(anon_client):
    assert anon_client.get("/api/riddlex/career-site").status_code == 401
    assert anon_client.put("/api/riddlex/career-site", json=VALID).status_code == 401
    assert anon_client.post("/api/riddlex/career-site/logo").status_code == 401


# ---------------------------------------------------------------- routes (DB-backed; skipped without RIDDLEX_TEST_DB_*)
URL = "/api/riddlex/career-site"


def test_get_returns_json_null_when_none(client, auth_headers):
    r = client.get(URL, headers=auth_headers())
    assert r.status_code == 200
    assert r.get_json() is None
    assert r.data.strip() == b"null"


def test_put_upsert_is_idempotent(client, auth_headers, db):
    h = auth_headers()
    r1 = client.put(URL, json=VALID, headers=h)
    assert r1.status_code == 200, r1.get_json()
    body = r1.get_json()
    assert body["slug"] == "acme-corp" and body["languages"] == ["en", "fr"]
    assert body["updatedAt"].endswith("Z") and "logoDataUrl" not in body
    r2 = client.put(URL, json=make(tagline="Changed"), headers=h)
    assert r2.status_code == 200 and r2.get_json()["tagline"] == "Changed"
    cur = db.cursor()
    cur.execute("SELECT COUNT(*) FROM riddlex_career_sites")
    assert cur.fetchone()[0] == 1
    assert client.get(URL, headers=h).get_json()["tagline"] == "Changed"


def test_slug_collision_across_orgs_is_409_and_does_not_clobber(client, auth_headers):
    ha = auth_headers(org="a@x.com", user="a@x.com")
    hb = auth_headers(org="b@x.com", user="b@x.com")
    assert client.put(URL, json=VALID, headers=ha).status_code == 200
    r = client.put(URL, json=make(companyName="Other Co"), headers=hb)
    assert r.status_code == 409
    assert r.get_json() == {"message": "That career site URL is taken."}
    assert client.get(URL, headers=ha).get_json()["companyName"] == "Acme Corp"
    assert client.get(URL, headers=hb).get_json() is None
    # org B already has a site and tries to move onto A's slug
    assert client.put(URL, json=make(slug="b-co"), headers=hb).status_code == 200
    assert client.put(URL, json=VALID, headers=hb).status_code == 409
    assert client.get(URL, headers=hb).get_json()["slug"] == "b-co"


def test_put_validation_and_foreign_logo_url(client, auth_headers):
    h = auth_headers()
    assert client.put(URL, json=make(slug="x"), headers=h).status_code == 400
    r = client.put(URL, json=make(logoUrl="https://evil.example/x.png"), headers=h)
    assert r.status_code == 400


def test_logo_upload_flow(client, auth_headers, local):
    h = auth_headers()
    r = client.post("/api/riddlex/career-site/logo", headers=h,
                    data={"file": (io.BytesIO(PNG), "logo.png")}, content_type="multipart/form-data")
    assert r.status_code == 200, r.get_json()
    url = r.get_json()["logoUrl"]
    assert url == f"{BASE}logos/{hashlib.sha256(PNG).hexdigest()}.png"
    # idempotent
    r2 = client.post("/api/riddlex/career-site/logo", headers=h,
                     data={"file": (io.BytesIO(PNG), "other-name.png")}, content_type="multipart/form-data")
    assert r2.get_json()["logoUrl"] == url
    assert client.put(URL, json=make(logoUrl=url), headers=h).get_json()["logoUrl"] == url
    # key absent -> logo kept; explicit "" -> cleared
    no_logo = make(tagline="t2")
    del no_logo["logoUrl"]
    assert client.put(URL, json=no_logo, headers=h).get_json()["logoUrl"] == url
    assert client.put(URL, json=make(logoUrl=""), headers=h).get_json()["logoUrl"] == ""


def test_arabic_round_trip(client, auth_headers):
    h = auth_headers()
    body = make(tagline="وظائف في القاهرة", hiringLocations=["القاهرة", "الرياض"], languages=["ar", "en"],
                defaultLanguage="ar")
    assert client.put(URL, json=body, headers=h).status_code == 200
    got = client.get(URL, headers=h).get_json()
    assert got["tagline"] == "وظائف في القاهرة"
    assert got["hiringLocations"] == ["القاهرة", "الرياض"]


@pytest.mark.parametrize("payload", [
    pytest.param(b"\x89PNG\r\n\x1a\n" + b"0" * (300 * 1024), id="too-big"),
    pytest.param(b"GIF89a" + b"0" * 10, id="wrong-type"),
    pytest.param(b"<svg onload='x()'></svg>", id="svg-onload"),
])
def test_logo_rejections(client, auth_headers, local, payload):
    r = client.post("/api/riddlex/career-site/logo", headers=auth_headers(),
                    data={"file": (io.BytesIO(payload), "logo.png")}, content_type="multipart/form-data")
    assert r.status_code == 400
    assert "logo" in r.get_json()["message"].lower()


def test_logo_missing_file(client, auth_headers):
    r = client.post("/api/riddlex/career-site/logo", headers=auth_headers(), data={},
                    content_type="multipart/form-data")
    assert r.status_code == 400
