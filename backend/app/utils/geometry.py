def is_within_bounds(x: float, y: float, w: float, h: float, store_w: float, store_h: float) -> bool:
    """
    Checks if a rectangle defined by (x, y, w, h) fits entirely inside store boundary (0, 0, store_w, store_h).
    """
    if x < 0 or y < 0 or w <= 0 or h <= 0:
        return False
    return (x + w <= store_w) and (y + h <= store_h)
