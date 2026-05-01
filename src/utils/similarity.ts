// Lightweight in-browser semantic similarity proxy (Token Overlap / Jaccard Index)
export function computeSimilarity(textA: string, textB: string): number {
  if (!textA || !textB) return 0;
  
  const tokenize = (text: string) => {
    return new Set(text.toLowerCase().match(/\b\w+\b/g) || []);
  };
  
  const setA = tokenize(textA);
  const setB = tokenize(textB);
  
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  
  const union = setA.size + setB.size - intersection;
  return intersection / union;
}
