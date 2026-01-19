"""
Advanced DXF Text Parser for Multi-Source Data Integration
Handles structured labels (AREA = value), room detection, and metadata extraction.

Ported into `python_standalone/` so the backend can use it without depending on any other folder.
"""

import re
from typing import Dict, List

import ezdxf


class StructuredTextParser:
    """
    Parses structured text labels from DXF files.
    Examples:
    - "GROUND FLOOR AREA = 464.66 SQM"
    - "GUARD ROOM AREA = 21.27 SQM"
    - "PLOT AREA = 1066.53 m²"
    """

    # Pattern: "LABEL = VALUE UNIT"
    STRUCTURED_PATTERN = re.compile(
        r"([A-Z\s&\-\.]+?)\s*=\s*(\d+\.?\d*)\s*(?:SQM|m2|m²|M2)?",
        re.IGNORECASE,
    )

    # Room-like labels
    ROOM_KEYWORDS = {
        "bedroom",
        "bed room",
        "bed",
        "br",
        "bathroom",
        "bath",
        "toilet",
        "wc",
        "shower",
        "kitchen",
        "kitch",
        "living",
        "sitting",
        "hall",
        "salon",
        "majles",
        "guard",
        "security",
        "electrical",
        "elec",
        "mechanical",
        "mech",
        "lobby",
        "corridor",
        "passage",
        "garage",
        "carport",
        "parking",
    }

    # Floor/Building labels
    FLOOR_KEYWORDS = {
        "ground floor",
        "ground fl",
        "gf",
        "ground",
        "first floor",
        "first fl",
        "1st floor",
        "ff",
        "first",
        "roof floor",
        "roof fl",
        "roof",
        "rf",
        "total area",
        "total built",
        "plot area",
        "plot",
        "site area",
        "land area",
    }

    @classmethod
    def parse_structured_labels(cls, dxf_file: str) -> Dict:
        """
        Parse all structured text labels from DXF.
        """
        doc = ezdxf.readfile(dxf_file)
        modelspace = doc.modelspace()

        result = {"plot_area": None, "floors": {}, "rooms": [], "metadata": {}}

        all_labels = []

        # Extract TEXT entities
        for entity in modelspace.query("TEXT"):
            all_labels.append(
                {
                    "text": entity.dxf.text,
                    "x": entity.dxf.insert[0],
                    "y": entity.dxf.insert[1],
                }
            )

        # Extract MTEXT entities
        for entity in modelspace.query("MTEXT"):
            all_labels.append(
                {
                    "text": entity.text,
                    "x": entity.dxf.insert[0],
                    "y": entity.dxf.insert[1],
                }
            )

        # First pass: label-value pairs (close proximity matching)
        used_indices = set()

        for i, label in enumerate(all_labels):
            if i in used_indices:
                continue

            text_upper = str(label.get("text", "")).upper()

            if "PLOT" in text_upper and "AREA" in text_upper:
                # Find nearby value
                x1, y1 = label["x"], label["y"]
                for j in range(i + 1, min(i + 15, len(all_labels))):
                    if j in used_indices:
                        continue
                    value_label = all_labels[j]
                    x2, y2 = value_label["x"], value_label["y"]
                    distance = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5

                    if distance < 10000:
                        vm = re.search(r"=?\s*(\d+\.?\d*)", str(value_label.get("text", "")))
                        if vm:
                            result["plot_area"] = float(vm.group(1))
                            used_indices.add(j)
                            break

            elif "GUARD" in text_upper and "AREA" in text_upper:
                # Find nearby value
                x1, y1 = label["x"], label["y"]
                for j in range(i + 1, min(i + 15, len(all_labels))):
                    if j in used_indices:
                        continue
                    value_label = all_labels[j]
                    x2, y2 = value_label["x"], value_label["y"]
                    distance = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5

                    if distance < 10000:
                        vm = re.search(r"=?\s*(\d+\.?\d*)", str(value_label.get("text", "")))
                        if vm:
                            result["rooms"].append({"name": "guard room", "area": float(vm.group(1))})
                            used_indices.add(j)
                            break

        # Second pass: structured labels with "="
        for i, label in enumerate(all_labels):
            if i in used_indices:
                continue

            text = str(label.get("text", ""))
            text_upper = text.upper()

            matches = cls.STRUCTURED_PATTERN.findall(text_upper)

            for label_part, value_str in matches:
                label_part = label_part.strip()
                label_lower = label_part.lower()
                value = float(value_str)

                # Check if floor
                if any(kw in label_lower for kw in cls.FLOOR_KEYWORDS):
                    if "plot" in label_lower:
                        result["plot_area"] = value
                    elif "ground" in label_lower:
                        result["floors"]["ground"] = value
                    elif "first" in label_lower or "1st" in label_lower:
                        result["floors"]["first"] = value
                    elif "roof" in label_lower:
                        result["floors"]["roof"] = value
                    elif "total" in label_lower:
                        result["metadata"]["total_area"] = value

                # Check if room
                elif any(kw in label_lower for kw in cls.ROOM_KEYWORDS):
                    result["rooms"].append({"name": label_part.lower(), "area": value})

                # Store as metadata
                else:
                    result["metadata"][label_part.lower()] = value

        return result


