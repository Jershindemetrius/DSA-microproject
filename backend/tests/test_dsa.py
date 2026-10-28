from app.dsa.frequency_counter import FrequencyCounter
from app.dsa.sliding_window import SlidingWindowCounter
from app.dsa.top_k_anomalies import TopKAnomalies
from app.dsa.event_correlation import EventCorrelationGraph


def test_frequency_counter_and_sliding_window():
    counter = FrequencyCounter()
    counter.add("10.0.0.1")
    counter.add("10.0.0.1")
    assert counter.get("10.0.0.1") == 2

    window = SlidingWindowCounter(window_seconds=60)
    window.add_event("10.0.0.1", __import__("datetime").datetime.utcnow())
    assert window.count("10.0.0.1") == 1


def test_top_k_heap_and_graph_correlation():
    heap = TopKAnomalies(k=2)
    heap.push("10.0.0.1", 5.0, {"count": 5})
    heap.push("10.0.0.2", 7.0, {"count": 7})
    heap.push("10.0.0.3", 8.0, {"count": 8})
    top = heap.top()
    assert len(top) == 2
    assert top[0]["entity"] in {"10.0.0.2", "10.0.0.3"}

    graph = EventCorrelationGraph()
    graph.connect("198.51.100.7", "alice")
    graph.connect("alice", "admin")
    assert "admin" in graph.bfs_related("198.51.100.7")
