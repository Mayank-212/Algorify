import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { generateId } from "@/lib/utils";

mermaid.initialize({
  startOnLoad: false,
  suppressErrorRendering: true,
  theme: 'base',
  themeVariables: {
    darkMode: true,
    background: 'transparent',
    primaryColor: '#27272a',
    primaryTextColor: '#fafafa',
    primaryBorderColor: '#3f3f46',
    lineColor: '#a1a1aa',
    secondaryColor: '#18181b',
    tertiaryColor: '#3f3f46',
    nodeTextColor: '#ffffff',
    mainBkg: '#27272a',
    textColor: '#ffffff',
  },
  fontFamily: "inherit",
});

export const Mermaid = ({ chart }: { chart: string }) => {
  const [svg, setSvg] = useState<string>("");
  const id = useRef(`mermaid-${generateId()}`);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      try {
        const originalError = console.error;
        console.error = () => {};
        
        try {
          // Check validity first to prevent DOM error elements
          const isValid = await mermaid.parse(chart).catch(() => false);
          if (!isValid) {
            if (isMounted) setSvg(`<div class="text-text-muted text-xs p-3 text-center border border-border-primary/50 bg-bg-tertiary/20 rounded-xl font-mono">Interactive diagram rendering...</div>`);
            return;
          }
          const { svg: renderedSvg } = await mermaid.render(id.current, chart);
          if (isMounted) setSvg(renderedSvg);
        } finally {
          console.error = originalError;
        }
      } catch (err) {
        if (isMounted) setSvg(`<div class="text-text-muted text-xs p-3 text-center border border-border-primary/50 bg-bg-tertiary/20 rounded-xl font-mono">Interactive diagram rendering...</div>`);
      }
    };
    renderChart();
    return () => { isMounted = false; };
  }, [chart]);

  if (!svg) {
    return <div className="animate-pulse bg-bg-tertiary/20 h-32 rounded-xl my-4"></div>;
  }

  return (
    <div 
      className="my-4 flex justify-center bg-bg-tertiary/20 p-4 rounded-xl border border-border-primary overflow-x-auto" 
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
};
