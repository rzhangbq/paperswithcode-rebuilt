import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface ContentRendererProps {
  content: string;
  className?: string;
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  console.log('ContentRenderer received:', content.substring(0, 100) + '...');

  // Function to safely render math expressions
  const renderMath = (math: string, isBlock: boolean) => {
    try {
      // Remove overly aggressive corruption detection - let the fix handle it
      
      // Fix corrupted LaTeX by replacing escaped underscores and specific corruption patterns
      let fixedMath = math;
      
      // Fix the specific corruption: mathbf -> \mathbf (when it's missing the backslash)
      if (math.includes('mathbf') && !math.includes('\\mathbf')) {
        fixedMath = math.replace(/\bmathbf\b/g, '\\mathbf');
      }
      
      // Fix escaped underscores: \_ -> _ (apply this after fixing mathbf)
      fixedMath = fixedMath.replace(/\\_/g, '_');
      console.log('Rendering math:', fixedMath.substring(0, 50) + '...', 'isBlock:', isBlock);
      console.log('Original math:', math.substring(0, 50) + '...');
      console.log('Fixed math:', fixedMath.substring(0, 50) + '...');
      if (isBlock) {
        return (
          <BlockMath 
            math={fixedMath}
            errorColor="#cc0000"
            renderError={(error: any) => {
              console.error('BlockMath error:', error);
              return (
                <span className="text-red-600 text-sm">
                  Math Error: {error.message}
                </span>
              );
            }}
          />
        );
      } else {
        return (
          <InlineMath 
            math={fixedMath}
            errorColor="#cc0000"
            renderError={(error: any) => {
              console.error('InlineMath error:', error);
              return (
                <span className="text-red-600 text-sm">
                  Math Error: {error.message}
                </span>
              );
            }}
          />
        );
      }
    } catch (error) {
      console.error('Math rendering error:', error);
      return <span className="text-red-600 text-sm">Math rendering error</span>;
    }
  };

  // Function to process content and render math expressions within Markdown
  const renderContent = (text: string) => {
    try {
      console.log('Processing content for math delimiters...');
      console.log('Raw text:', text.substring(0, 200) + '...');
      
      // More accurate math parsing: process block math first, then inline math
      const parts: Array<{ type: 'text' | 'inline-math' | 'block-math'; content: string }> = [];
      
      // First, find all block math expressions ($$...$$)
      const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
      let lastIndex = 0;
      let match;
      
      while ((match = blockMathRegex.exec(text)) !== null) {
        // Add text before block math
        if (match.index > lastIndex) {
          parts.push({
            type: 'text',
            content: text.slice(lastIndex, match.index)
          });
        }
        
        // Add block math
        parts.push({
          type: 'block-math',
          content: match[1]
        });
        
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text after block math
      if (lastIndex < text.length) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex)
        });
      }
      
      // Now process each text part to find inline math
      const finalParts: Array<{ type: 'text' | 'inline-math' | 'block-math'; content: string }> = [];
      
      for (const part of parts) {
        if (part.type === 'block-math') {
          finalParts.push(part);
          continue;
        }
        
        // Process text part for inline math - more robust parsing
        // Handle LaTeX expressions with braces properly
        let textContent = part.content;
        let textLastIndex = 0;
        
        while (true) {
          const dollarIndex = textContent.indexOf('$', textLastIndex);
          if (dollarIndex === -1) break;
          
          // Find the closing dollar sign
          let closingIndex = -1;
          let braceCount = 0;
          let i = dollarIndex + 1;
          
          console.log('Looking for closing $ starting at index', i, 'in text:', textContent.substring(dollarIndex, dollarIndex + 20));
          
          while (i < textContent.length) {
            if (textContent[i] === '$' && braceCount === 0) {
              closingIndex = i;
              console.log('Found closing $ at index', i, 'braceCount:', braceCount);
              break;
            } else if (textContent[i] === '{') {
              braceCount++;
              console.log('Opening brace at index', i, 'braceCount:', braceCount);
            } else if (textContent[i] === '}') {
              braceCount--;
              console.log('Closing brace at index', i, 'braceCount:', braceCount);
            }
            i++;
          }
          
          if (closingIndex === -1) break;
          
          // Add text before inline math
          if (dollarIndex > textLastIndex) {
            finalParts.push({
              type: 'text',
              content: textContent.slice(textLastIndex, dollarIndex)
            });
          }
          
          // Add inline math
          const mathContent = textContent.slice(dollarIndex + 1, closingIndex);
          finalParts.push({
            type: 'inline-math',
            content: mathContent
          });
          
          textLastIndex = closingIndex + 1;
        }
        
        // Add remaining text after inline math
        if (textLastIndex < textContent.length) {
          finalParts.push({
            type: 'text',
            content: textContent.slice(textLastIndex)
          });
        }
      }
      
      console.log('Found', finalParts.length, 'parts:', finalParts.map(p => ({ 
        type: p.type, 
        preview: p.content.substring(0, 50),
        length: p.content.length,
        fullContent: p.content
      })));
      
      // Debug: Check if any parts look like corrupted math
      finalParts.forEach((part, index) => {
        if (part.type === 'text' && (part.content.includes('mathbf') || part.content.includes('left') || part.content.includes('right'))) {
          console.log('WARNING: Part', index, 'is marked as text but contains math-like content:', part.content.substring(0, 100));
        }
      });
      
      // Group consecutive text and inline math parts together for proper inline flow
      const groupedParts: Array<{ type: 'block-math' | 'inline-flow'; content: any[] }> = [];
      let currentInlineFlow: any[] = [];
      
      for (const part of finalParts) {
        if (part.type === 'block-math') {
          // If we have accumulated inline content, add it as a group
          if (currentInlineFlow.length > 0) {
            groupedParts.push({ type: 'inline-flow', content: currentInlineFlow });
            currentInlineFlow = [];
          }
          // Add block math as its own group
          groupedParts.push({ type: 'block-math', content: [part] });
        } else {
          // Accumulate text and inline math for inline flow
          currentInlineFlow.push(part);
        }
      }
      
      // Don't forget the last inline flow group
      if (currentInlineFlow.length > 0) {
        groupedParts.push({ type: 'inline-flow', content: currentInlineFlow });
      }
      
      return groupedParts.map((group, index) => {
        if (group.type === 'block-math') {
          const part = group.content[0];
          console.log('Rendering block math:', part.content.substring(0, 50));
          return renderMath(part.content, true);
        }
        
        // Render inline flow (text + inline math) together
        return (
          <div key={index} className="markdown-content">
            {group.content.map((part, partIndex) => {
              if (part.type === 'inline-math') {
                console.log('Rendering inline math:', part.content.substring(0, 50));
                console.log('Full inline math content:', part.content);
                return (
                  <>
                    {' '}
                    {renderMath(part.content, false)}
                    {' '}
                  </>
                );
              }
              
              // Regular text - render as Markdown
              return (
                <ReactMarkdown 
                  key={partIndex}
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Custom components for better styling
                    p: ({ children }) => <span className="text-gray-700 leading-relaxed">{children}</span>,
                    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                    em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
                    a: ({ href, children }) => (
                      <a 
                        href={href} 
                        className="text-blue-600 hover:text-blue-800 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-3">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-3">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-700">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4">
                        {children}
                      </blockquote>
                    ),
                    code: ({ inline, className, children, ...props }: any) => {
                      const code = String(children).replace(/\n$/, '');
                      if (inline) {
                        return (
                          <code className={`${className} bg-gray-100 px-1 py-0.5 rounded text-sm font-mono`} {...props}>
                            {code}
                          </code>
                        );
                      }
                      return (
                        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                          <code className={`${className} text-sm font-mono`} {...props}>
                            {code}
                          </code>
                        </pre>
                      );
                    },
                  }}
                >
                  {part.content}
                </ReactMarkdown>
              );
            })}
          </div>
        );
      });
    } catch (error) {
      console.error('ContentRenderer error:', error);
      return <span className="text-red-600">Content rendering error</span>;
    }
  };

  return (
    <div className={`content-renderer ${className}`}>
      {renderContent(content)}
    </div>
  );
}; 