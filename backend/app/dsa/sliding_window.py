from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import Deque, Dict, Iterable, List, Tuple


class SlidingWindowCounter:
    """Tracks counts inside a fixed time window using a deque for efficient expiry."""

    def __init__(self, window_seconds: int = 300):
        self.window_seconds = window_seconds
        self._events: Dict[str, Deque[datetime]] = defaultdict(deque)

    def add_event(self, key: str, timestamp: datetime) -> None:
        queue = self._events[key]
        queue.append(timestamp)
        cutoff = timestamp - timedelta(seconds=self.window_seconds)
        while queue and queue[0] < cutoff:
            queue.popleft()

    def add_events(self, key: str, timestamps: Iterable[datetime]) -> None:
        for timestamp in timestamps:
            self.add_event(key, timestamp)

    def count(self, key: str, timestamp: datetime | None = None) -> int:
        reference = timestamp or datetime.utcnow()
        queue = self._events.get(key, deque())
        cutoff = reference - timedelta(seconds=self.window_seconds)
        while queue and queue[0] < cutoff:
            queue.popleft()
        return len(queue)

    def snapshot(self) -> Dict[str, int]:
        return {key: len(values) for key, values in self._events.items() if values}
