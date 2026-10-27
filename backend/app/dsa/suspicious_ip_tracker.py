from typing import Iterable, List, Set


class SuspiciousIPTracker:
    """Hash-set tracking for suspicious IP addresses."""

    def __init__(self):
        self._ips: Set[str] = set()

    def add(self, ip: str | None) -> bool:
        if not ip:
            return False
        if ip in self._ips:
            return False
        self._ips.add(ip)
        return True

    def add_many(self, ips: Iterable[str | None]) -> List[str]:
        added: List[str] = []
        for ip in ips:
            if self.add(ip):
                added.append(ip)
        return added

    def contains(self, ip: str | None) -> bool:
        return bool(ip and ip in self._ips)

    def all(self) -> List[str]:
        return sorted(self._ips)
