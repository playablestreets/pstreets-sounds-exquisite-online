#!/usr/bin/env python3
"""Content-pipeline ingest for Exquisite Stories.

Pulls vetted assets out of the Drive PENDING tree, normalises them to the
site's formats (256x256 PNG images, mono ~80kbps MP3 audio) and writes them
into public/assets/content/ alongside a manifest.json that the site loads.

Images and audio are kept as DECOUPLED pools per body part. Each asset carries
a `group` key (image timestamp / audio recording id) and a null `association`
field so the two pools can be re-linked in a later pass without re-ingesting.

Drive files are fetched over the public sharing link (uc?export=download),
so no API write scope is needed. Re-running is idempotent.
"""
import subprocess, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "assets" / "content"
DL = "https://drive.google.com/uc?export=download&id={}"

# part -> [(group, drive_id)]   Tier A cropper PNGs only.
IMAGES = {
    "top": [
        ("20260531-124038", "1Qns93WivEwqVw9EvxUJihpDeYAgOLQHU"),
        ("20260531-124708", "1zyWYs7QNUmdY1zVBx0X8u0tmoGchtI8K"),
        ("20260531-140345", "1BA7qY49Ikf6IjRQDe7J2EYkFafNw9rvU"),
        ("20260531-140549", "10UXXQDwFAVZnC1qtbw9Wth9-mQKL37Ck"),
        ("20260531-140724", "1EmVUHJ2ef7Lcf6x6vQahgPufK_GgbfAS"),
        ("20260531-142957", "1o2l2K_2WOO7RsYCo8Yda6k64LWYgL_uh"),
        ("20260531-143231", "1RUNMXiT-gb481BHTo18gvG_atpmfSF_Y"),
        ("20260531-143342", "1nVCL88ST8JnWBN4md2lbfPVGFfN4Qd_E"),
        ("20260531-143509", "1Yf1-CvshzMfmHbHS_C2RFZ2SNGTldRaK"),
        ("20260531-143625", "19EgA7qdcT9bbEO2gPBoWsBQ8h-LVDZ26"),
        ("20260531-143826", "1J9leQrmlTjnNd9eywSo9qd5eM7441zV1"),
        ("20260531-143932", "1lqpcAkBjySo7hFUfSIval4ND2I8GER1M"),
        ("20260531-144049", "1ugU4M1oOQPjPAuauH2655nNcttn5P_E0"),
    ],
    "middle": [
        ("20260531-124038", "1vhckUqk14WG2WKsctpvkEMQgiZwZ-aRe"),
        ("20260531-124750", "1v8TP9pVcfVDimvU8-EYhsbCtpJ_Lkze6"),
        ("20260531-140345", "1Wz93u2_Ic9TfTIwLfxyYGReJx2Ayayak"),
        ("20260531-140549", "1PLl49l_pXz7nHaCxnY_N4gd6aH14g5UP"),
        ("20260531-140948", "1g17aX3l6GNhQNNLLFG5Hd8BYioIn-Sho"),
        ("20260531-143033", "1Y8yNwT20fz1psrF_0F7bx_pnKma9LrqE"),
        ("20260531-143231", "1JSCLsU3WuA89Y9z2ZemZW-G_eDzyo7Y3"),
        ("20260531-143342", "1ifPqqShEByHYia482mKpR3hN282tVuui"),
        ("20260531-143509", "1c4XapJUEPP1U0-Zltu5RY5WuPPPZM9Bt"),
        ("20260531-143625", "11TqALfSlyXoYvDQUTgwN2qT2QmrnydCg"),
        ("20260531-143826", "1ePrxVKwaYKgKgtBw_J2NGK5j7P0p-r9E"),
        ("20260531-143932", "1ogUnRprDEXn73n7rXXDiSsvhmVxHUBrV"),
        ("20260531-144049", "12-Kv2VqLFxLPBpUZFse7KUtcdF-zgM3Q"),
    ],
    "bottom": [
        ("20260531-124038", "1aKhw-LHRw5PmzNo2kvadQfATrSThvf7q"),
        ("20260531-124752", "1HvTYrd1JTZ-xGX2uxc2WGzXFICI9DnQc"),
        ("20260531-140345", "16qK6Bqs928RxlYlnG82ZCSVPO0KWM5NQ"),
        ("20260531-140549", "1xVIHt7llI74_rsX2mM6WTd9e6COEjVEP"),
        ("20260531-140845", "1AxTzVbO3cITyaVfUuZdBb4DZsX7fZ9aS"),
        ("20260531-143056", "10-Z-qGG8l1Rpjc5FAJq6WMoaTmIjgiKw"),
        ("20260531-143231", "1OqbheVE5h6aQf2YlaL-X5N0USFQig0w1"),
        ("20260531-143342", "1PNsM8wnFSPHr0h9jMFPn551nyPQ7WyY6"),
        ("20260531-143509", "1OTUoFZTLK5BAsGA_NXxrlcVfCNCy34w3"),
        ("20260531-143625", "1kg0qLYkhcPvaKyqSSTTly5pBksEbHUqM"),
        ("20260531-143826", "145DMQZkNFVromeylfIlt8pCuw3ENreP6"),
        ("20260531-143932", "1M5h9dirnmlct5L8kjjZUcQmtnQAKYoIK"),
        ("20260531-144049", "1gok3_UXF2TGjqnLrPR6HX3VoOEEkQz1B"),
    ],
}

# Audio: site part -> [(group, drive_id, ext)].  beginning->top, middle->middle, end->bottom.
AUDIO = {
    "top": [
        ("char-2026-05-31T01-30-11", "1Iz9dPravKHzQ0I85F6BeLBayb8B_g6ua", "wav"),
        ("char-2026-05-31T01-35-24", "1dy4m1kXwahsZUA7t5Gz_1-gkTQo2xuua", "wav"),
        ("zander", "1SGB_gnMEj3UCfOOXivHNUnGO592_T780", "mp3"),
        ("faith",  "1MX-I8zlfHBW55WbHNx8OxaHUg7Uj7GaH", "mp3"),
        ("faith2", "1kAYbotdEhljl41yiO4LnZiQRAlHz1eLM", "mp3"),
    ],
    "middle": [
        ("char-2026-05-31T01-30-11", "1b_BBg914mVSnbHR9ecOO3QgqSfjrSBJT", "wav"),
        ("char-2026-05-31T01-35-24", "1u9TbHoRS8RRo-z4nma5E5wSrfQBA6vTS", "wav"),
        ("zander", "1eQEix_6ds5OHJ3pa8I9qOjMvYw8rQBDq", "mp3"),
        ("faith",  "137eAtokAoq8fhRCDpPLJoT1HmurUdCZR", "mp3"),
        ("faith2", "1W3WstPo05RGue4Fl-IcsiyNMSTCOMXHo", "mp3"),
    ],
    "bottom": [
        ("char-2026-05-31T01-30-11", "142gMfCKivnb7EwB5PRZXkNrmhtPJFXM4", "wav"),
        ("char-2026-05-31T01-35-24", "1LRIjreljIeCwEuxIZ_verTtKesknZyYn", "wav"),
        ("zander", "1-5HwqCVJnKAp2TwYhq4g6BeNnkvl_4Xs", "mp3"),
        ("faith",  "1ujfZpIkJXsm3QscIgFKRxLg5A78OIPjz", "mp3"),
        ("faith2", "13KrRmASUx5k_4NETEc77_mjXFNwqyBFw", "mp3"),
    ],
}


def fetch(drive_id, dest):
    urllib.request.urlretrieve(DL.format(drive_id), dest)
    if dest.stat().st_size == 0:
        raise RuntimeError(f"empty download for {drive_id}")


def main():
    tmp = OUT / "_tmp"
    tmp.mkdir(parents=True, exist_ok=True)

    for part, items in IMAGES.items():
        d = OUT / "images" / part
        d.mkdir(parents=True, exist_ok=True)
        for group, fid in items:
            raw = tmp / f"img_{fid}"
            fetch(fid, raw)
            out = d / f"{group}.png"
            subprocess.run(["sips", "-s", "format", "png", "-z", "256", "256",
                            str(raw), "--out", str(out)],
                           check=True, capture_output=True)
            print(f"image {part}/{group}.png")

    for part, items in AUDIO.items():
        d = OUT / "audio" / part
        d.mkdir(parents=True, exist_ok=True)
        for group, fid, ext in items:
            raw = tmp / f"aud_{fid}.{ext}"
            fetch(fid, raw)
            out = d / f"{group}.mp3"
            if ext == "wav":
                subprocess.run(["ffmpeg", "-y", "-i", str(raw), "-ac", "1",
                                "-ar", "44100", "-b:a", "80k", str(out)],
                               check=True, capture_output=True)
            else:
                out.write_bytes(raw.read_bytes())
            print(f"audio {part}/{group}.mp3")

    for f in tmp.iterdir():
        f.unlink()
    tmp.rmdir()

    # The manifest is generated by scanning the pool dirs, so it reflects
    # everything present (including assets added by other means).
    subprocess.run([sys.executable, str(Path(__file__).with_name("build_manifest.py"))],
                   check=True)


if __name__ == "__main__":
    main()
