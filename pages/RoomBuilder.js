import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Stage, Layer, Line, Circle, Shape, Image as KonvaImage } from 'react-konva';

const DynamicStage = dynamic(() => import('react-konva').then(mod => mod.Stage), { ssr: false });
const DynamicLayer = dynamic(() => import('react-konva').then(mod => mod.Layer), { ssr: false });

const gridSize = 20;
const PLOT_CONFIG = {
  width: 64,
  height: 45,
};




const SingleFloorPlan = () => {
  const [floorPlan, setFloorPlan] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCustomRoom, setIsCustomRoom] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [previewPosition, setPreviewPosition] = useState(null);
  const [customVertices, setCustomVertices] = useState([]);
  const [image, setImage] = useState(null);
  const [imageObj, setImageObj] = useState(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageOpacity, setImageOpacity] = useState(1);
  const [gridOpacity, setGridOpacity] = useState(0.5);
  const [floorPlanOpacity, setFloorPlanOpacity] = useState(0.3);
  const [plotHeight, setPlotHeight] = useState(PLOT_CONFIG.height * gridSize);
  const [plotWidth, setPlotWidth] = useState(PLOT_CONFIG.width* gridSize);
  const [gridSizeValue, setGridSizeValue] = useState(gridSize);

  useEffect(() => {
    const storedData = sessionStorage.getItem('FloorPlanData');
    const storedImage = sessionStorage.getItem('ImageData');
    const storedImagePosition = sessionStorage.getItem('ImagePosition');
    const gridSize = sessionStorage.getItem('GridSize');
    const gridHeight = sessionStorage.getItem('GridHeight');
    const gridWidth = sessionStorage.getItem('GridWidth');

    if (storedData) {
      setFloorPlan(JSON.parse(storedData));
    }

    if (storedImage) {
      setImage(storedImage);
      const img = new window.Image();
      img.src = storedImage;
      img.onload = () => setImageObj(img);
    }

    if (storedImagePosition) {
      setImagePosition(JSON.parse(storedImagePosition));
    }
    if (gridSize){
      setGridSizeValue(JSON.parse(gridSize));
    }
    if (gridHeight){
      setPlotHeight(JSON.parse(gridHeight));
    }
    if (gridWidth){
      setPlotWidth(JSON.parse(gridWidth));
    }
  }, []);

  const snapToGrid = (value) => Math.round(value / gridSizeValue) * gridSizeValue;

  const isPointInPolygon = (point, vertices) => {
    let x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x, yi = vertices[i].y;
      const xj = vertices[j].x, yj = vertices[j].y;

      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const calculateArea = (vertices) => {
    let area = 0;
    const n = vertices.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += vertices[i].x * vertices[j].y;
      area -= vertices[j].x * vertices[i].y;
    }
    return Math.abs(area) / 2;
  };

  const handleDragStart = (e) => {
    if (!floorPlan) return;
    setIsDragging(true);
    const stage = e.target.getStage();
    const mousePos = stage.getPointerPosition();

    setDragOffset({
      x: mousePos.x - floorPlan.redDotPosition.x,
      y: mousePos.y - floorPlan.redDotPosition.y,
    });
  };

  const handleDragMove = (e) => {

    const stage = e.target.getStage();
    const mousePos = stage.getPointerPosition();

    const newX = snapToGrid(mousePos.x - dragOffset.x);
    const newY = snapToGrid(mousePos.y - dragOffset.y);

    setPreviewPosition({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    if (!floorPlan) return;
    const newVertices = floorPlan.vertices.map(vertex => ({
      x: vertex.x + previewPosition.x - floorPlan.redDotPosition.x,
      y: vertex.y + previewPosition.y - floorPlan.redDotPosition.y,
    }));

    const updatedFloorPlan = {
      ...floorPlan,
      vertices: newVertices,
      redDotPosition: { x: previewPosition.x, y: previewPosition.y },
    };

    setFloorPlan(updatedFloorPlan);
    setIsDragging(false);
    setPreviewPosition(null);
 
  };

  const handleStageClick = (e) => {
    if (isCustomRoom) {
      const stage = e.target.getStage();
      const mousePos = stage.getPointerPosition();
      const clickedPosition = {
        x: snapToGrid(mousePos.x),
        y: snapToGrid(mousePos.y),
      };

      setCustomVertices(prevVertices => {
        if (prevVertices.length > 0 &&
            clickedPosition.x === prevVertices[0].x &&
            clickedPosition.y === prevVertices[0].y) {
          const newFloorPlan = {
            id: 1,
            vertices: prevVertices,
            redDotPosition: { x: prevVertices[0].x, y: prevVertices[0].y },
          };
          setFloorPlan(newFloorPlan);
          setCustomVertices([]);
          setIsCustomRoom(false);
      
        }
        return [...prevVertices, clickedPosition];
      });
    } else {
      const stage = e.target.getStage();
      const mousePos = stage.getPointerPosition();
      const clickedPosition = {
        x: snapToGrid(mousePos.x),
        y: snapToGrid(mousePos.y),
      };

      if (floorPlan && isPointInPolygon(clickedPosition, floorPlan.vertices)) {
        // Handle click on existing floor plan
      }
    }
  };

  const toggleCustomRoom = () => {
    setIsCustomRoom(!isCustomRoom);
    if (!isCustomRoom) {
      setCustomVertices([]);
    }
  };

  const clearFloorPlanData = () => {
    setFloorPlan(null);
    setCustomVertices([]);
    setImage(null);
    setImageObj(null);
    setImagePosition({ x: 0, y: 0 });
    sessionStorage.removeItem('FloorPlanData');
    sessionStorage.removeItem('ImageData');
    sessionStorage.removeItem('ImagePosition');
    sessionStorage.removeItem('IsComplete');
    alert('Floor plan data cleared!');
  };

  const saveFloorPlan = () => {
   
      sessionStorage.setItem('FloorPlanData', JSON.stringify(floorPlan));
      sessionStorage.setItem('GridSize', JSON.stringify(gridSize));
      sessionStorage.setItem('GridHeight', JSON.stringify(plotHeight));
      sessionStorage.setItem('GridWidth', JSON.stringify(plotWidth));
      alert('Floor plan saved!');
    
  };

  const resetFloorPlan = () => {
   
    sessionStorage.setItem('FloorPlanData', JSON.stringify(null));
    setFloorPlan(null);
    setCustomVertices([]);

  
};


  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.src = reader.result;
        img.onload = () => {
          setImageObj(img);
        };
        setImage(reader.result);
        sessionStorage.setItem('ImageData', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const scaleImage = (img) => {
    const scale = Math.min(plotWidth / img.width, plotHeight / img.height);
    return {
      width: img.width * scale,
      height: img.height * scale,
      x: imagePosition.x,
      y: imagePosition.y,
    };
  };

  const moveImage = (dx, dy) => {
    const newPosition = { x: imagePosition.x + dx, y: imagePosition.y + dy };
    setImagePosition(newPosition);

  };

  const handleGridSizeChange = (e) => {
    const newGridSize = Math.min(Number(e.target.value), 100);
    setGridSizeValue(newGridSize);
 
  };

  const handleHeightChange = (e) => {
    const newHeight = Math.min(Number(e.target.value), 100);
    setPlotHeight(newHeight * gridSizeValue);

  };

  const handleWidthChange = (e) => {
    const newWidth = Math.min(Number(e.target.value), 100);
    setPlotWidth(newWidth * gridSizeValue);

  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ 
        flex: '2', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        position: 'relative',
        backgroundColor: 'white' 
      }}>
        <DynamicStage
          width={plotWidth + 1} 
          height={plotHeight + 1} 
          onClick={handleStageClick}
          style={{ display: 'block', border: '1px solid black' }} 
        >
          <DynamicLayer>
            {imageObj && (
              <KonvaImage
                image={imageObj}
                width={scaleImage(imageObj).width}
                height={scaleImage(imageObj).height}
                x={imagePosition.x}
                y={imagePosition.y}
                opacity={imageOpacity}
                zIndex={-1}
              />
            )}

            {Array.from({ length: Math.ceil(plotWidth / gridSizeValue) + 1 }).map((_, i) => (
              <Line key={`v-${i}`} points={[i * gridSizeValue, 0, i * gridSizeValue, plotHeight]} stroke="darkgrey" opacity={gridOpacity} />
            ))}
            {Array.from({ length: Math.ceil(plotHeight / gridSizeValue) + 1 }).map((_, i) => (
              <Line key={`h-${i}`} points={[0, i * gridSizeValue, plotWidth, i * gridSizeValue]} stroke="darkgrey" opacity={gridOpacity} />
            ))}

            {floorPlan && (
              <Shape
                key={floorPlan.id}
                sceneFunc={(context) => {
                  context.beginPath();
                  floorPlan.vertices.forEach((vertex, idx) => {
                    const x = vertex.x;
                    const y = vertex.y;
                    if (idx === 0) {
                      context.moveTo(x, y);
                    } else {
                      context.lineTo(x, y);
                    }
                  });
                  context.closePath();
                  context.fillStyle = `rgba(173, 216, 230, ${floorPlanOpacity})`;
                  context.fill();
                  context.strokeStyle = 'black';
                  context.stroke();
                }}
              />
            )}

            {isDragging && previewPosition && floorPlan &&  (
              <Shape
                sceneFunc={(context) => {
                  context.beginPath();
                  floorPlan.vertices.forEach((vertex, idx) => {
                    const x = vertex.x + previewPosition.x - floorPlan.redDotPosition.x;
                    const y = vertex.y + previewPosition.y - floorPlan.redDotPosition.y;
                    if (idx === 0) {
                      context.moveTo(x, y);
                    } else {
                      context.lineTo(x, y);
                    }
                  });
                  context.closePath();
                  context.fillStyle = `rgba(173, 216, 230, ${floorPlanOpacity + 0.2})`;
                  context.fill();
                  context.strokeStyle = 'blue';
                  context.stroke();
                }}
              />
            )}

            {floorPlan && (
              <Circle
                key={`axis-point-${floorPlan.id}`}
                x={floorPlan.redDotPosition.x}
                y={floorPlan.redDotPosition.y}
                radius={8}
                fill="red"
                stroke="black"
                strokeWidth={2}
                draggable
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
              />
            )}

            {customVertices.map((vertex, index) => (
              <Circle
                key={index}
                x={vertex.x}
                y={vertex.y}
                radius={5}
                fill="blue"
              />
            ))}

            {customVertices.map((vertex, index) => {
              if (index < customVertices.length - 1) {
                return (
                  <Line
                    key={`line-${index}`}
                    points={[vertex.x, vertex.y, customVertices[index + 1].x, customVertices[index + 1].y]}
                    stroke="blue"
                    strokeWidth={2}
                  />
                );
              }
              return null;
            })}
          </DynamicLayer>
        </DynamicStage>

     
      </div>

      <div style={{ flex: '1', padding: '0px', display: 'flex', flexDirection: 'column', color: 'white', margin: 0, backgroundColor: 'grey', height: '100%', overflowY: 'auto' }}>
        <div style={{ flexGrow: 1, padding: '15px' }}>
          <h3>Floor Plan Details</h3>
          {floorPlan ? (
            <p>
              Floor Plan:
              <br />
              Coordinates: x: {floorPlan.redDotPosition.x / gridSize} ft, y: {floorPlan.redDotPosition.y / gridSize} ft
              <br />
              Area: {calculateArea(floorPlan.vertices)} sq ft
            </p>
          ) : (
            <p>No floor plan created yet.</p>
          )}
        </div>

        <div>
        
          <button 
                onClick={clearFloorPlanData} 
                style={{ 
                  backgroundColor: 'red', 
                  color: 'white', 
                  padding: '10px', 
                  margin: '10px 0' 
                }}
           
              >
                {'Clear'}
              </button>
          
      
              <button 
                onClick={toggleCustomRoom} 
                style={{ 
                  backgroundColor: 'green', 
                  color: 'white', 
                  padding: '10px', 
                  margin: '10px 0' 
                }}
                disabled={floorPlan}
              >
                {'Draw Floorplan'}
              </button>
              <button 
                onClick={resetFloorPlan} 
                style={{ 
                  backgroundColor: 'Orange', 
                  color: 'white', 
                  padding: '10px', 
                  margin: '10px 0' 
                }}
                
              >
                Reset
              </button>
              <button 
                onClick={saveFloorPlan} 
                style={{ 
                  backgroundColor: 'blue', 
                  color: 'white', 
                  padding: '10px', 
                  margin: '10px 0' 
                }}
                
              >
                Save
              </button>
           
        
          
        </div>

        <div style={{ margin: '10px 0' }}>
          <label style={{ color: 'white' }}>Image Opacity: </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={imageOpacity} 
            onChange={(e) => setImageOpacity(parseFloat(e.target.value))} 
          />
        </div>
        <div style={{ margin: '10px 0' }}>
          <label style={{ color: 'white' }}>Grid Opacity: </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={gridOpacity} 
            onChange={(e) => setGridOpacity(parseFloat(e.target.value))} 
          />
        </div>
        <div style={{ margin: '10px 0' }}>
          <label style={{ color: 'white' }}>Floor Plan Fill Opacity: </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={floorPlanOpacity} 
            onChange={(e) => setFloorPlanOpacity(parseFloat(e.target.value))} 
          />
        </div>

    

       

       
      </div>
    </div>
  );
};

export default SingleFloorPlan;
