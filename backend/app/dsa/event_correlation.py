from collections import defaultdict, deque
from typing import Any, DefaultDict, Dict, List, Set, Tuple


class EventCorrelationGraph:
    """Adjacency-list graph for event correlation via BFS/DFS."""

    def __init__(self):
        self.graph: DefaultDict[str, Set[str]] = defaultdict(set)

    def connect(self, source: str, target: str) -> None:
        if source and target:
            self.graph[source].add(target)
            self.graph[target].add(source)

    def add_event(self, source: str, related: List[str]) -> None:
        for item in related:
            self.connect(source, item)

    def bfs_related(self, start: str) -> List[str]:
        if not start:
            return []
        visited: Set[str] = {start}
        queue: deque[str] = deque([start])
        result: List[str] = []
        while queue:
            node = queue.popleft()
            result.append(node)
            for neighbor in sorted(self.graph.get(node, set())):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return result

    def connected_components(self) -> List[List[str]]:
        seen: Set[str] = set()
        components: List[List[str]] = []
        for node in sorted(self.graph.keys()):
            if node in seen:
                continue
            queue: deque[str] = deque([node])
            component: List[str] = []
            seen.add(node)
            while queue:
                current = queue.popleft()
                component.append(current)
                for neighbor in sorted(self.graph.get(current, set())):
                    if neighbor not in seen:
                        seen.add(neighbor)
                        queue.append(neighbor)
            components.append(component)
        return components
