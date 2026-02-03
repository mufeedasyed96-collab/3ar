"""
ezdxf-based geometry extraction methods for DXF files.
This module provides accurate polygon and entity extraction using the ezdxf library.
"""

import ezdxf
import math
from typing import List, Dict, Tuple, Optional


def extract_geometry_ezdxf(dxf_file: str) -> List[Dict]:
    """
    Extract all closed polygons and geometric entities from DXF using ezdxf.
    
    Returns list of dictionaries with:
    - type: Entity type (LWPOLYLINE, POLYLINE, CIRCLE, HATCH, etc.)
    - layer: Layer name
    - vertices: List of (x, y) tuples
    - closed: Boolean indicating if path is closed
    - area: Raw area (in drawing units squared)
    """
    try:
        doc = ezdxf.readfile(dxf_file)
    except Exception as e:
        print(f"Error reading DXF with ezdxf: {e}")
        return []
    
    modelspace = doc.modelspace()
    geometry_list = []
    
    # Process LWPOLYLINE entities
    for entity in modelspace.query('LWPOLYLINE'):
        try:
            vertices = [(p[0], p[1]) for p in entity.get_points('xy')]
            if len(vertices) < 3:
                continue
            
            is_closed = entity.closed
            area = 0.0
            
            if is_closed and len(vertices) >= 3:
                # Calculate area using shoelace formula
                area = calculate_polygon_area(vertices)
            
            geometry_list.append({
                'type': 'LWPOLYLINE',
                'layer': entity.dxf.layer,
                'vertices': vertices,
                'closed': is_closed,
                'area': abs(area)
            })
        except Exception as e:
            print(f"Warning: Could not process LWPOLYLINE: {e}")
            continue
    
    # Process POLYLINE entities
    for entity in modelspace.query('POLYLINE'):
        try:
            vertices = [(v.dxf.location[0], v.dxf.location[1]) for v in entity.vertices]
            if len(vertices) < 3:
                continue
            
            is_closed = entity.is_closed
            area = 0.0
            
            if is_closed and len(vertices) >= 3:
                area = calculate_polygon_area(vertices)
            
            geometry_list.append({
                'type': 'POLYLINE',
                'layer': entity.dxf.layer,
                'vertices': vertices,
                'closed': is_closed,
                'area': abs(area)
            })
        except Exception as e:
            print(f"Warning: Could not process POLYLINE: {e}")
            continue
    
    # Process CIRCLE entities
    for entity in modelspace.query('CIRCLE'):
        try:
            center = (entity.dxf.center[0], entity.dxf.center[1])
            radius = entity.dxf.radius
            
            # Approximate circle with polygon (32 points)
            num_points = 32
            vertices = []
            for i in range(num_points):
                angle = 2 * math.pi * i / num_points
                x = center[0] + radius * math.cos(angle)
                y = center[1] + radius * math.sin(angle)
                vertices.append((x, y))
            
            area = math.pi * radius * radius
            
            geometry_list.append({
                'type': 'CIRCLE',
                'layer': entity.dxf.layer,
                'vertices': vertices,
                'closed': True,
                'area': area
            })
        except Exception as e:
            print(f"Warning: Could not process CIRCLE: {e}")
            continue
    
    # Process HATCH entities (filled regions)
    for entity in modelspace.query('HATCH'):
        try:
            # Get boundary paths from hatch
            for path in entity.paths:
                if path.PATH_TYPE == 'PolylinePath':
                    vertices = [(v[0], v[1]) for v in path.vertices]
                    if len(vertices) < 3:
                        continue
                    
                    area = calculate_polygon_area(vertices)
                    
                    geometry_list.append({
                        'type': 'HATCH',
                        'layer': entity.dxf.layer,
                        'vertices': vertices,
                        'closed': True,
                        'area': abs(area)
                    })
                elif path.PATH_TYPE == 'EdgePath':
                    # Process edge path (lines, arcs, etc.)
                    vertices = extract_edge_path_vertices(path)
                    if len(vertices) >= 3:
                        area = calculate_polygon_area(vertices)
                        geometry_list.append({
                            'type': 'HATCH',
                            'layer': entity.dxf.layer,
                            'vertices': vertices,
                            'closed': True,
                            'area': abs(area)
                        })
        except Exception as e:
            print(f"Warning: Could not process HATCH: {e}")
            continue
    
    return geometry_list


def calculate_polygon_area(vertices: List[Tuple[float, float]]) -> float:
    """
    Calculate polygon area using the shoelace formula.
    Returns signed area (positive for counter-clockwise, negative for clockwise).
    """
    if len(vertices) < 3:
        return 0.0
    
    area = 0.0
    n = len(vertices)
    for i in range(n):
        j = (i + 1) % n
        area += vertices[i][0] * vertices[j][1]
        area -= vertices[j][0] * vertices[i][1]
    
    return area / 2.0


def extract_edge_path_vertices(edge_path, num_arc_segments: int = 16) -> List[Tuple[float, float]]:
    """
    Extract vertices from a HATCH edge path (which can contain lines, arcs, ellipses, etc.)
    """
    vertices = []
    
    for edge in edge_path.edges:
        if edge.EDGE_TYPE == 'LineEdge':
            vertices.append((edge.start[0], edge.start[1]))
        elif edge.EDGE_TYPE == 'ArcEdge':
            # Approximate arc with line segments
            center = edge.center
            radius = edge.radius
            start_angle = edge.start_angle
            end_angle = edge.end_angle
            
            # Handle angle wrapping
            if end_angle < start_angle:
                end_angle += 360
            
            angle_range = end_angle - start_angle
            for i in range(num_arc_segments + 1):
                angle = math.radians(start_angle + (angle_range * i / num_arc_segments))
                x = center[0] + radius * math.cos(angle)
                y = center[1] + radius * math.sin(angle)
                vertices.append((x, y))
        elif edge.EDGE_TYPE == 'EllipseEdge':
            # Approximate ellipse arc with line segments
            center = edge.center
            major_axis = edge.major_axis
            ratio = edge.ratio
            start_param = edge.start_param
            end_param = edge.end_param
            
            for i in range(num_arc_segments + 1):
                param = start_param + (end_param - start_param) * i / num_arc_segments
                # Simplified ellipse calculation
                x = center[0] + major_axis[0] * math.cos(param)
                y = center[1] + major_axis[1] * math.sin(param) * ratio
                vertices.append((x, y))
    
    return vertices
