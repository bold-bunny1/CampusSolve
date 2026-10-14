"""
HostelPulse Priority & Urgency Engine
Deterministic, transparent rule-based engine for hostel complaints.
Evaluates category, impact level, resident urgency, and safety hazards.
"""

from typing import Dict, Any, List
from datetime import datetime, timezone

# Safety keywords for keyword inspection
SAFETY_KEYWORDS = {
    "electrical": ["spark", "sparks", "shock", "electric shock", "exposed wire", "short circuit", "smoke", "fire", "burning", "fuse burst"],
    "security": ["broken lock", "door broken", "window latch broken", "theft", "unauthorized entry", "intrusion", "harassment", "physical safety"],
    "water_structure": ["flood", "flooding", "ceiling collapse", "sewage overflow", "pipe burst", "contaminated water", "gas leak"],
}

SAFETY_CATEGORIES = {"Electrical", "Security", "Water Supply"}

def evaluate_priority(
    category: str,
    urgency_level: str,
    impact_level: str,
    title: str = "",
    description: str = "",
    created_at: datetime = None
) -> Dict[str, Any]:
    """
    Evaluates complaint priority deterministically based on clear rules.
    Returns:
        priority: 'Critical' | 'High' | 'Medium' | 'Low'
        priority_reason: Human-readable explanation of why priority was assigned
        is_safety_hazard: Boolean indicating if flagged for immediate safety review
        safety_review_notes: Clarification / guidance note
    """
    text_corpus = f"{title.lower()} {description.lower()}"
    matched_safety_keywords: List[str] = []
    
    for domain, kws in SAFETY_KEYWORDS.items():
        for kw in kws:
            if kw in text_corpus:
                matched_safety_keywords.append(kw)
    
    is_safety = len(matched_safety_keywords) > 0 or (category in SAFETY_CATEGORIES and urgency_level == "Emergency")

    # Score-based transparent weighting
    # Urgency weights: Low=10, Medium=25, High=45, Emergency=70
    urgency_scores = {"Low": 10, "Medium": 25, "High": 45, "Emergency": 70}
    urgency_score = urgency_scores.get(urgency_level, 20)

    # Impact weights: Single Room=15, Entire Floor=35, Entire Wing/Block=60
    impact_scores = {"Single Room": 15, "Entire Floor": 35, "Entire Wing/Block": 60}
    impact_score = impact_scores.get(impact_level, 15)

    # Category critical weights: Essential services get baseline boost
    category_weights = {
        "Electrical": 20,
        "Security": 25,
        "Water Supply": 20,
        "Internet": 10,
        "Plumbing": 15,
        "Cleanliness": 10,
        "Furniture": 5,
        "Other": 5
    }
    category_score = category_weights.get(category, 10)

    # Hazard boost
    hazard_score = 40 if is_safety else 0

    total_score = urgency_score + impact_score + category_score + hazard_score

    reasons: List[str] = []

    # Priority determination with explicit overrides
    if is_safety and (impact_level in ["Entire Floor", "Entire Wing/Block"] or urgency_level in ["High", "Emergency"]):
        priority = "Critical"
        reasons.append(f"Immediate safety hazard identified ({', '.join(matched_safety_keywords) if matched_safety_keywords else 'Emergency ' + category}) with broad impact ({impact_level})")
    elif is_safety:
        priority = "Critical" if urgency_level == "Emergency" else "High"
        reasons.append(f"Safety hazard indicators flagged: {', '.join(matched_safety_keywords) if matched_safety_keywords else category}")
    elif total_score >= 110:
        priority = "Critical"
        reasons.append(f"High cumulative severity score ({total_score}) from {urgency_level} urgency and {impact_level} impact on essential service ({category})")
    elif total_score >= 70:
        priority = "High"
        reasons.append(f"High priority score ({total_score}): {urgency_level} urgency affecting {impact_level.lower()} in category '{category}'")
    elif total_score >= 45:
        priority = "Medium"
        reasons.append(f"Standard operational priority: {urgency_level} urgency with {impact_level.lower()} scope")
    else:
        priority = "Low"
        reasons.append(f"Routine maintenance: {urgency_level} urgency with localized {impact_level.lower()} impact")

    # Time aging factor (if complaint has been open without resolution)
    if created_at:
        # If open for > 48 hours and still Low/Medium, escalate
        now = datetime.now(timezone.utc)
        if created_at.tzinfo is None:
            # Handle naive datetime
            diff_hours = (now.replace(tzinfo=None) - created_at).total_seconds() / 3600
        else:
            diff_hours = (now - created_at).total_seconds() / 3600

        if diff_hours > 72 and priority in ["Low", "Medium"]:
            priority = "High"
            reasons.append(f"Escalated due to unresolved duration ({int(diff_hours)} hours elapsed)")
        elif diff_hours > 48 and priority == "Low":
            priority = "Medium"
            reasons.append(f"Escalated due to aging ({int(diff_hours)} hours elapsed)")

    safety_notes = None
    if is_safety:
        safety_notes = "SAFETY REVIEW REQUIRED: Verified hazard markers detected. Flagged for immediate warden and senior maintenance review. (Note: HostelPulse is a triage workflow system; for live life-safety emergencies, notify campus emergency services immediately.)"

    return {
        "priority": priority,
        "priority_reason": "; ".join(reasons),
        "is_safety_hazard": is_safety,
        "safety_review_notes": safety_notes,
        "matched_keywords": matched_safety_keywords,
        "score": total_score
    }
