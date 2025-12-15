import React, { useState, useEffect } from 'react';
import { Bot, PenSquare, Clapperboard, Download, Zap } from 'lucide-react';
import axios from 'axios';

const PRESETS = {
  "digital-futurism": {
    name: "Digital Futurism",
    suffix: ", minimalist hand-drawn black ink sketch, bright ORANGE SCARF (#FF6B35), PURE BLACK VOID (#000000), high contrast, editorial illustration.",
    timing: 13,
    theme: { accent: 'orange-500', bg: 'bg-gray-900' },
    voice: "Deep Male (Fenrir)"
  },
  "productivity-sketch": {
    name: "Productivity Sketch",
    suffix: ", rough pencil sketch on CRUMPLED GRAPH PAPER (#FFFFFF), Graphite Black ink (#333333), Highlighter YELLOW (#FAFF00) accents, messy lines.",
    timing: 8,
    theme: { accent: 'yellow-400', bg: 'bg-gray-800' },
    voice: "Fast/Crisp Male (Puck)"
  },
  "bible-stories": {
    name: "Bible Stories",
    suffix: ", biblical era oil painting, golden light, ancient robes, desert landscape, cinematic 8k, dramatic lighting.",
    timing: 13,
    theme: { accent: 'amber-400', bg: 'bg-stone-900' },
    voice: "Calm Female (Zephyr)"
  }
};

const App = () => {
  const [script, setScript] = useState('');
  const [style, setStyle] = useState('digital-futurism');
  const [scenes, setScenes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState({});
  const [progress, setProgress] = useState(0);

  const currentPreset = PRESETS[style];

  useEffect(() => {
    const lowerScript = script.toLowerCase();
    if (lowerScript.includes('dopamine') || lowerScript.includes('focus')) setStyle('digital-futurism');
    else if (lowerScript.includes('productivity') || lowerScript.includes('system')) setStyle('productivity-sketch');
    else if (lowerScript.includes('god') || lowerScript.includes('jesus')) setStyle('bible-stories');
  }, [script]);

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/analyze-script', { script, timingRule: currentPreset.timing });
      setScenes(response.data.scenes);
      setGeneratedAssets({});
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Failed to analyze script. Check the server logs for details.");
    }
    setIsLoading(false);
  };

  const handleGenerateAll = async () => {
    if (scenes.length === 0) return;
    setIsLoading(true);
    setProgress(0);

    let tempAssets = {};

    for (let i = 0; i < scenes.length; i++) {
        const sceneText = scenes[i];

        try {
            const [imageRes, audioRes] = await Promise.all([
                axios.post('/api/generate-image', { scene: sceneText, promptSuffix: currentPreset.suffix }),
                axios.post('/api/generate-speech', { scene: sceneText, voice: currentPreset.voice })
            ]);
            tempAssets[i] = { image: imageRes.data.imageUrl, audio: audioRes.data.audioUrl };
        } catch (error) {
            console.error(`Failed to generate assets for scene ${i}:`, error);
            tempAssets[i] = { image: 'error', audio: 'error' };
        }

        setGeneratedAssets(prev => ({...prev, ...tempAssets}));
        setProgress(((i + 1) / scenes.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
    }

    setIsLoading(false);
  };

  const totalImageCost = Object.keys(generatedAssets).length * 0.04;
  const totalCharCount = scenes.reduce((acc, s) => acc + s.length, 0);
  const totalAudioCost = totalCharCount * 0.000016;
  const totalCost = totalImageCost + totalAudioCost;

  return (
    <div className={`min-h-screen ${currentPreset.theme.bg} text-white font-sans transition-colors duration-500`}>
      <header className={`p-4 border-b border-${currentPreset.theme.accent}`}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Clapperboard className={`text-${currentPreset.theme.accent}`} /> The Creator Station
        </h1>
      </header>

      <main className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2"><PenSquare size={20} /> Script & Analysis</h2>
              <select value={style} onChange={e => setStyle(e.target.value)} className="bg-gray-700 border border-gray-600 rounded p-2">
                {Object.keys(PRESETS).map(key => <option key={key} value={key}>{PRESETS[key].name}</option>)}
              </select>
          </div>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Paste your video script here..."
            className="w-full h-64 p-4 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button onClick={handleAnalyze} disabled={isLoading || !script} className={`w-full flex items-center justify-center gap-2 bg-${currentPreset.theme.accent} text-black font-bold py-3 px-4 rounded-md disabled:bg-gray-500 transition-transform transform hover:scale-105`}>
            {isLoading ? "Analyzing..." : <><Bot size={20} /> Auto-Split Scenes</>}
          </button>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Scenes ({scenes.length})</h3>
            <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
              {scenes.map((scene, index) => (
                <div key={index} className="bg-gray-800 p-3 rounded text-sm">
                  <strong className={`text-${currentPreset.theme.accent}`}>Scene {index + 1}:</strong> {scene}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Zap size={20} /> Asset Generation Studio</h2>
            <button onClick={handleGenerateAll} disabled={isLoading || scenes.length === 0} className={`w-full flex items-center justify-center gap-2 bg-${currentPreset.theme.accent} text-black font-bold py-3 px-4 rounded-md disabled:bg-gray-500 transition-transform transform hover:scale-105`}>
               Generate All Assets
            </button>
            {isLoading && <div className="w-full bg-gray-700 rounded-full h-2.5"><div className={`bg-${currentPreset.theme.accent} h-2.5 rounded-full`} style={{ width: `${progress}%` }}></div></div>}

            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
               {scenes.map((scene, i) => (
                 <div key={i} className="bg-gray-800 rounded-lg p-4">
                    <p className="text-xs mb-2"><strong className={`text-${currentPreset.theme.accent}`}>Scene {i+1}</strong></p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            {generatedAssets[i]?.image === 'error' && <div className="aspect-video bg-red-900/50 flex items-center justify-center rounded">Error</div>}
                            {generatedAssets[i]?.image && generatedAssets[i]?.image !== 'error' ? 
                                <img src={generatedAssets[i].image} alt={`Scene ${i+1}`} className="aspect-video w-full object-cover rounded-md animate-ken-burns"/>
                                : <div className="aspect-video bg-gray-700 flex items-center justify-center rounded">Awaiting Image...</div>
                            }
                        </div>
                        <div>
                            {generatedAssets[i]?.audio === 'error' && <div className="h-full bg-red-900/50 flex items-center justify-center rounded">Error</div>}
                            {generatedAssets[i]?.audio && generatedAssets[i]?.audio !== 'error' ?
                                <audio controls src={generatedAssets[i].audio} className="w-full"></audio>
                                : <div className="h-full bg-gray-700 flex items-center justify-center rounded text-sm">Awaiting Audio...</div>
                            }
                        </div>
                    </div>
                 </div>
               ))}
            </div>

            <div className="mt-auto pt-4 border-t border-gray-700 flex justify-between items-center">
                <div>
                  <h4 className="font-bold">Estimated Cost: <span className={`text-${currentPreset.theme.accent}`}>${totalCost.toFixed(4)}</span></h4>
                  <p className="text-xs text-gray-400">{Object.keys(generatedAssets).length} images, {totalCharCount} chars</p>
                </div>
                <button className="flex items-center gap-2 bg-gray-600 py-2 px-4 rounded-md hover:bg-gray-500">
                    <Download size={16} /> Download ZIP
                </button>
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
