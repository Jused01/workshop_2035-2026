# models.py
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional
from datetime import datetime

@dataclass
class Joueur:
    id: str
    nickname: str
    role: str
    joinedAt: datetime
    isConnected: bool = True

@dataclass
class Game:
    id: str
    code: str
    status: str                   # waiting | running | finished | abandoned
    createdAt: datetime
    startedAt: Optional[datetime]
    endsAt: Optional[datetime]
    currentRoomIndex: int
    hintsLeft: int
    seed: int
    players: List[Player] = field(default_factory=list)

def to_firestore_dict(obj):
    """Convertit dataclass -> dict compatible Firestore."""
    d = asdict(obj)
    return d
