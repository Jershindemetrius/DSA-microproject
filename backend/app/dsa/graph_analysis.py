from typing import List

from app.dsa.event_correlation import EventCorrelationGraph


class GraphAnalyzer:
    def __init__(self):
        self.graph = EventCorrelationGraph()

    def correlate(self, entities: List[tuple[str, list[str]]]) -> List[dict[str, object]]:
        for source, neighbors in entities:
            self.graph.add_event(source, neighbors)
        components = self.graph.connected_components()
        return [{"entities": component} for component in components if len(component) > 1]
