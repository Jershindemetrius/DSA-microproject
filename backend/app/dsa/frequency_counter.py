from collections import defaultdict
from typing import DefaultDict, Iterable, List, Tuple


class FrequencyCounter:
    """Dictionary-based frequency counting with average O(1) lookups."""

    def __init__(self):
        self._counts: DefaultDict[str, int] = defaultdict(int)

    def add(self, key: str) -> int:
        self._counts[key] += 1
        return self._counts[key]

    def add_many(self, keys: Iterable[str]) -> None:
        for key in keys:
            self.add(key)

    def get(self, key: str) -> int:
        return self._counts.get(key, 0)

    def most_common(self, limit: int = 10) -> List[Tuple[str, int]]:
        return sorted(self._counts.items(), key=lambda item: (-item[1], item[0]))[:limit]

    def as_dict(self) -> dict[str, int]:
        return dict(self._counts)
