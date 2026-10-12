"""Constants ported from OpusReact/src/store/apis/riddlexMockServer.ts (validators come in later tasks)."""
import re

STAGES = ["New", "In Review", "Interview", "Offer", "Hired", "Rejected"]
JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"]
JOB_STATUSES = ["Open", "Closed"]
LANGUAGES = ["en", "ar", "fr"]
LANGUAGE_DIRS = {"en": "ltr", "ar": "rtl", "fr": "ltr"}
FONTS = ["inter", "poppins", "montserrat", "lato", "playfair", "cairo", "tajawal", "plex-arabic"]

SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
HEX_COLOR = re.compile(r"^#[0-9a-f]{6}$", re.IGNORECASE)
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

SLUG_MIN_LEN, SLUG_MAX_LEN = 3, 40


# ---------------------------------------------------------------- career site (Task 3)
# Port of validateCareerSite in riddlexMockServer.ts. `logoDataUrl` became `logoUrl`.
from .errors import ApiError  # noqa: E402

COLOR_KEYS = ("primary", "accent", "background", "text")
LOGO_URL_PATTERN = re.compile(r"^logos/[0-9a-f]{64}\.(?:png|jpg|svg)$")
MAX_LOGO_BYTES = 300 * 1024
_LOGO_MSG = "The logo must be a PNG, JPG or SVG image under 300 KB."


def _str(value) -> str:
    return value if isinstance(value, str) else ""


def validate_career_site(data, logo_base_url=None) -> dict:
    """Validate/normalise a CareerSiteInput (camelCase dict). Raises ApiError(400) with the mock's messages.

    `logo_base_url`: prefix a non-empty `logoUrl` must start with, followed by `logos/<sha256>.<ext>`;
    None disables the check.
    """

    def fail(message):
        raise ApiError(400, message)

    if not isinstance(data, dict):
        fail("Invalid request body.")
    company = _str(data.get("companyName")).strip()
    slug = _str(data.get("slug")).strip().lower()
    if len(company) < 2:
        fail("Company name must be at least 2 characters.")
    if len(company) > 120:
        fail("Company name must be at most 120 characters.")
    if len(slug) < SLUG_MIN_LEN or len(slug) > SLUG_MAX_LEN or not SLUG_PATTERN.match(slug):
        fail("Career site URL must be 3-40 characters: lowercase letters, numbers and single hyphens.")

    raw_colors = data.get("colors") if isinstance(data.get("colors"), dict) else {}
    colors = {}
    for name in COLOR_KEYS:
        value = raw_colors.get(name)
        if not isinstance(value, str) or not HEX_COLOR.match(value):
            fail(f"The {name} color must be a hex value like #1a2b3c.")
        colors[name] = value.lower()

    font = data.get("font")
    if not isinstance(font, str) or font not in FONTS:
        fail("Choose a font from the list.")

    # Absent / null logoUrl -> None = keep the stored logo; "" explicitly clears it.
    logo_url = data.get("logoUrl")
    if logo_url is not None and not isinstance(logo_url, str):
        fail(_LOGO_MSG)
    if logo_url and logo_base_url is not None:
        rest = logo_url[len(logo_base_url):]
        if not (logo_url.startswith(logo_base_url) and LOGO_URL_PATTERN.match(rest)):
            fail(_LOGO_MSG)

    raw_locs = data.get("hiringLocations") if isinstance(data.get("hiringLocations"), list) else []
    locations = list(dict.fromkeys(l.strip() for l in raw_locs if isinstance(l, str) and l.strip()))
    if not locations:
        fail("Add at least one hiring location.")
    if len(locations) > 25:
        fail("Add at most 25 hiring locations.")
    if any(len(l) > 100 for l in locations):
        fail("Each hiring location must be at most 100 characters.")

    raw_langs = data.get("languages") if isinstance(data.get("languages"), list) else []
    languages = [c for c in LANGUAGES if c in raw_langs]
    if not languages:
        fail("Select at least one language.")
    default_language = data.get("defaultLanguage")
    if not isinstance(default_language, str) or default_language not in languages:
        fail("The default language must be one of the supported languages.")

    tagline = _str(data.get("tagline")).strip()
    if len(tagline) > 255:
        fail("Tagline must be at most 255 characters.")
    if not isinstance(data.get("published"), bool):
        fail("Published must be true or false.")

    return {
        "companyName": company,
        "slug": slug,
        "tagline": tagline,
        "logoUrl": logo_url,
        "colors": colors,
        "font": font,
        "hiringLocations": locations,
        "languages": languages,
        "defaultLanguage": default_language,
        "published": data["published"],
    }
