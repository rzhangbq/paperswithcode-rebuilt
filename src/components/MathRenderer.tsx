import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  // Function to process content and render math expressions
  const renderMathContent = (text: string) => {
    // Split content by math delimiters
    const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/);
    
    return parts.map((part, index) => {
      
      // Inline math ($...$)
      if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.slice(1, -1);
        return (
          <InlineMath 
          key={index} 
          math={math}
          errorColor="#cc0000"
          renderError={(error) => (
            <span className="text-red-600 text-sm">
                Math Error: {error.message}
              </span>
            )}
            />
          );
        }
        
        // Block math ($$...$$)
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          return (
            <BlockMath 
              key={index} 
              math={math}
              errorColor="#cc0000"
              renderError={(error) => (
                <span className="text-red-600 text-sm">
                  Math Error: {error.message}
                </span>
              )}
            />
          );
        }
      // Regular text
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`math-content ${className}`}>
      {renderMathContent(content)}
    </div>
  );
}; 