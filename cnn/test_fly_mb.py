"""Mushroom body: sparse Kenyon code, sugar raises valence, lit cells are MB somas."""

from __future__ import annotations

from pathlib import Path

import numpy as np

from cnn.fly_mb import (
    KC_SPARSITY,
    FlyMushroom,
    MushroomBody,
    lit_soma_indices,
    save_circuit,
    synthetic_circuit,
)
from cnn.predict import PredictResult


def _tmp_circuit(path: Path) -> MushroomBody:
    blocks, info = synthetic_circuit(seed=0)
    save_circuit(blocks, info, path)
    return MushroomBody(path)


def test_kenyon_kwta_is_sparse(tmp_path: Path | None = None) -> None:
    path = (tmp_path or Path("models")) / "_test_mb.npz"
    path.parent.mkdir(parents=True, exist_ok=True)
    mb = _tmp_circuit(path)
    rng = np.random.default_rng(1)
    pn = rng.random(mb.n_pn)
    kc = mb.kenyon(pn)
    frac = float((kc > 0).mean())
    expected = mb.k / mb.n_kc
    assert abs(frac - expected) < 1e-9
    assert abs(expected - KC_SPARSITY) < 0.03 or mb.k == max(1, int(round(KC_SPARSITY * mb.n_kc)))
    path.unlink(missing_ok=True)


def test_sugar_raises_valence_of_trained_odour() -> None:
    path = Path("models") / "_test_mb_sugar.npz"
    path.parent.mkdir(parents=True, exist_ok=True)
    mb = _tmp_circuit(path)
    rng = np.random.default_rng(2)
    odour_a = rng.random(mb.n_pn)
    odour_b = rng.random(mb.n_pn)
    before_a = mb.valence_of(odour_a)
    before_b = mb.valence_of(odour_b)
    for _ in range(8):
        mb.present(odour_a, reward=1.0, learn=True)
    after_a = mb.valence_of(odour_a)
    after_b = mb.valence_of(odour_b)
    delta_a = after_a - before_a
    delta_b = after_b - before_b
    assert delta_a > delta_b
    assert after_a > before_a
    path.unlink(missing_ok=True)


def test_lit_indices_are_mushroom_body_somas() -> None:
    path = Path("models") / "_test_mb_lit.npz"
    path.parent.mkdir(parents=True, exist_ok=True)
    mb = _tmp_circuit(path)
    rng = np.random.default_rng(3)
    pn = rng.random(mb.n_pn)
    step = mb.present(pn, learn=False)
    lit = lit_soma_indices(mb, pn, step)
    allowed = set(mb.pn_soma.tolist() + mb.kc_soma.tolist() + mb.mbon_soma.tolist())
    cortex = set(range(mb.n_somas)) - allowed
    assert lit
    assert set(lit).issubset(allowed)
    assert not set(lit).intersection(cortex)
    path.unlink(missing_ok=True)


def test_try_load_missing_artifacts_is_none() -> None:
    import cnn.fly_mb as fly_mb

    old_mb, old_g = fly_mb.FLY_MB_PATH, fly_mb.FLY_GAINS_PATH
    fly_mb.FLY_MB_PATH = Path("models/_missing_mb.npz")
    fly_mb.FLY_GAINS_PATH = Path("models/_missing_gains.npz")
    try:
        assert FlyMushroom.try_load() is None
    finally:
        fly_mb.FLY_MB_PATH = old_mb
        fly_mb.FLY_GAINS_PATH = old_g


def test_predict_result_fly_defaults_none() -> None:
    result = PredictResult(
        is_hennen=False,
        label="PAS HENNEN",
        confidence=0.2,
        cosine=0.1,
        face_found=True,
        detail="autre",
    )
    assert result.fly is None


def test_real_flywire_circuit_lit_is_mb_if_present() -> None:
    from cnn.config import FLY_MB_PATH

    if not FLY_MB_PATH.exists():
        return
    mb = MushroomBody(FLY_MB_PATH)
    rng = np.random.default_rng(4)
    pn = rng.random(mb.n_pn)
    kc = mb.kenyon(pn)
    assert abs(float((kc > 0).mean()) - mb.k / mb.n_kc) < 1e-9
    step = mb.present(pn, learn=False)
    lit = lit_soma_indices(mb, pn, step)
    allowed = set(mb.pn_soma.tolist() + mb.kc_soma.tolist() + mb.mbon_soma.tolist())
    assert lit
    assert set(lit).issubset(allowed)
    assert mb.n_somas == 139255


if __name__ == "__main__":
    test_kenyon_kwta_is_sparse()
    test_sugar_raises_valence_of_trained_odour()
    test_lit_indices_are_mushroom_body_somas()
    test_try_load_missing_artifacts_is_none()
    test_predict_result_fly_defaults_none()
    test_real_flywire_circuit_lit_is_mb_if_present()
    print("ok")
