"""Windows/Linux-safe default photo folder (no hardcoded Linux home)."""

import os
from pathlib import Path

from cnn.config import default_hennen_src


def test_default_hennen_src_skips_missing_linux_home() -> None:
    src = default_hennen_src()
    linux = Path("/home/gablegoob/Desktop/hennen")
    assert src.is_absolute()
    if os.name == "nt" or not linux.exists():
        assert src != linux
        assert "gablegoob" not in src.as_posix()


def test_default_hennen_src_stays_under_home_when_linux_dir_absent() -> None:
    src = default_hennen_src()
    linux = Path("/home/gablegoob/Desktop/hennen")
    if linux.exists():
        assert src == linux
        return
    home = Path.home().resolve()
    assert src.resolve() == home / "Desktop" / "hennen" or home in src.resolve().parents or src.resolve().parent == home / "Desktop"


if __name__ == "__main__":
    test_default_hennen_src_skips_missing_linux_home()
    test_default_hennen_src_stays_under_home_when_linux_dir_absent()
    print("ok")
