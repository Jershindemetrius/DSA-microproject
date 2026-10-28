import heapq
from typing import Any, Iterable, List, Tuple


class TopKAnomalies:
    """Min-heap-based ranking for top-K suspicious entities."""

    def __init__(self, k: int = 10):
        self.k = k
        self.heap: List[Tuple[float, str, Any]] = []

    def push(self, entity: str, score: float, metadata: Any = None) -> None:
        item = (score, entity, metadata)
        if len(self.heap) < self.k:
            heapq.heappush(self.heap, item)
            return
        if item[0] > self.heap[0][0]:
            heapq.heapreplace(self.heap, item)

    def top(self) -> List[dict[str, Any]]:
        result: List[dict[str, Any]] = []
        for score, entity, metadata in sorted(self.heap, key=lambda x: (-x[0], x[1])):
            result.append({"entity": entity, "score": score, "metadata": metadata})
        return result

    def update_from_scores(self, scores: Iterable[tuple[str, float, Any]]) -> None:
        for entity, score, metadata in scores:
            self.push(entity, score, metadata)
