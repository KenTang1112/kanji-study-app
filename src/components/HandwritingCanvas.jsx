import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

const HandwritingCanvas = forwardRef((props, ref) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const isEnabled = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Set drawing styles
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Get mouse/touch position relative to canvas
    const getPosition = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches[0].clientX) - rect.left;
      const y = (e.clientY || e.touches[0].clientY) - rect.top;
      return { x, y };
    };

    // Start drawing
    const startDrawing = (e) => {
      if (!isEnabled.current) return;
      
      isDrawing.current = true;
      const pos = getPosition(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      
      // Prevent scrolling on touch devices
      if (e.type === 'touchstart') {
        e.preventDefault();
      }
    };

    // Draw
    const draw = (e) => {
      if (!isDrawing.current || !isEnabled.current) return;
      
      const pos = getPosition(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      
      // Prevent scrolling on touch devices
      if (e.type === 'touchmove') {
        e.preventDefault();
      }
    };

    // Stop drawing
    const stopDrawing = (e) => {
      isDrawing.current = false;
      
      // Prevent scrolling on touch devices
      if (e.type === 'touchend') {
        e.preventDefault();
      }
    };

    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch events for mobile/tablet
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing, { passive: false });
    canvas.addEventListener('touchcancel', stopDrawing);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
      canvas.removeEventListener('touchcancel', stopDrawing);
    };
  }, []);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    getImageData: () => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      
      return canvas.toDataURL('image/png');
    },
    disableCanvas: () => {
      isEnabled.current = false;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.opacity = '0.5';
        canvas.style.pointerEvents = 'none';
      }
    },
    enableCanvas: () => {
      isEnabled.current = true;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.opacity = '1';
        canvas.style.pointerEvents = 'auto';
      }
    }
  }));

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        className="handwriting-canvas border-2 border-gray-300 rounded-lg bg-white"
        style={{ 
          width: '300px', 
          height: '200px', 
          touchAction: 'none',
          cursor: 'crosshair'
        }}
      />
      <button
        onClick={handleClear}
        className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
      >
        Clear
      </button>
      <div className="mt-2 text-sm text-gray-500">
        Use mouse, touch, or Apple Pencil to write
      </div>
    </div>
  );
});

HandwritingCanvas.displayName = 'HandwritingCanvas';

export default HandwritingCanvas;
