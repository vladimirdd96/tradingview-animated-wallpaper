(() => {
  'use strict';
  if (window.__chartWallpaperHook) return;
  window.__chartWallpaperHook = true;
  const proto = CanvasRenderingContext2D.prototype;
  const fill = proto.fillRect;
  const clear = proto.clearRect;
  proto.fillRect = function(x, y, w, h) {
    const c = this.canvas;
    if (c.matches?.('canvas[data-name="pane-canvas"]') &&
        c.parentElement?.querySelector(':scope > [data-chart-wallpaper="ready"]')) {
      const t = this.getTransform();
      const x1 = t.a*x+t.c*y+t.e, y1 = t.b*x+t.d*y+t.f;
      const x2 = t.a*(x+w)+t.c*(y+h)+t.e, y2 = t.b*(x+w)+t.d*(y+h)+t.f;
      if (t.b === 0 && t.c === 0 && Math.min(x1,x2) <= 1 && Math.min(y1,y2) <= 1 &&
          Math.max(x1,x2) >= c.width-1 && Math.max(y1,y2) >= c.height-1) {
        this.save();
        this.resetTransform();
        clear.call(this, 0, 0, c.width, c.height);
        this.restore();
        return;
      }
    }
    return fill.call(this, x,y,w,h);
  };
})();
