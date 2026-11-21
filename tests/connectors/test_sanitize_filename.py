from urllib.parse import unquote

from connectors.util import content_disposition, sanitize_filename, valid_id


def test_path_traversal_reduced_to_basename():
    assert sanitize_filename("../../a.pdf") == "a.pdf"
    assert sanitize_filename("..\\..\\evil.docx") == "evil.docx"
    assert sanitize_filename("C:\\Users\\x\\cv.pdf") == "cv.pdf"


def test_control_and_reserved_chars_removed():
    assert sanitize_filename("a\x00b\r\n.pdf") == "ab.pdf"
    assert sanitize_filename('a<b>:c"d|e?f*g.pdf') == "abcdefg.pdf"


def test_long_name_keeps_extension():
    out = sanitize_filename("a" * 300 + ".pdf")
    assert len(out) == 150 and out.endswith(".pdf")


def test_empty_becomes_default():
    assert sanitize_filename("") == "file"
    assert sanitize_filename(None) == "file"
    assert sanitize_filename("   ") == "file"
    assert sanitize_filename("...") == "file"
    assert sanitize_filename("", default="x") == "x"


def test_unicode_preserved():
    assert sanitize_filename("سيرة ذاتية.pdf") == "سيرة ذاتية.pdf"


def test_valid_id():
    assert valid_id("abc-DEF_1.2!")
    assert not valid_id("../x")
    assert not valid_id("")
    assert not valid_id("a" * 201)
    assert not valid_id(None)


def test_content_disposition_has_ascii_fallback_and_utf8_name():
    header = content_disposition("سيرة.pdf")
    assert header.startswith('attachment; filename="file.pdf";')
    assert unquote(header.split("filename*=UTF-8''")[1]) == "سيرة.pdf"
    assert content_disposition("cv.pdf").startswith('attachment; filename="cv.pdf"')
