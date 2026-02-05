
import { GoogleGenAI, Type } from "@google/genai";
import { UIDesignStyle, ExtractedDesign, ProjectTreeNode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const handleApiError = (e: any) => {
  const message = e?.message || "";
  if (message.includes("429") || message.includes("quota") || message.includes("RESOURCE_EXHAUSTED")) {
    throw new Error("QUOTA_EXCEEDED");
  }
  throw e;
};

const safeJsonParse = (text: string) => {
  try {
    let cleaned = text.trim();
    const firstBracket = cleaned.indexOf('{');
    const firstSquare = cleaned.indexOf('[');
    let start = -1;
    if (firstBracket !== -1 && (firstSquare === -1 || firstBracket < firstSquare)) start = firstBracket;
    else start = firstSquare;

    const lastBracket = cleaned.lastIndexOf('}');
    const lastSquare = cleaned.lastIndexOf(']');
    let end = -1;
    if (lastBracket !== -1 && (lastSquare === -1 || lastBracket > lastSquare)) end = lastBracket;
    else end = lastSquare;

    if (start !== -1 && end !== -1) {
      cleaned = cleaned.substring(start, end + 1);
    }
    
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Critical JSON Parse Error:", e, "Raw text:", text);
    return text.trim().startsWith('[') ? [] : {};
  }
};

const designStyleSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    prompt: { type: Type.STRING, description: "デザインを再現するためのプロンプト" },
    colors: {
      type: Type.OBJECT,
      properties: {
        primary: { type: Type.STRING },
        secondary: { type: Type.STRING },
        accent: { type: Type.STRING },
        background: { type: Type.STRING },
        surface: { type: Type.STRING },
        text: { type: Type.STRING }
      },
      required: ["primary", "secondary", "background", "text"]
    },
    typography: {
      type: Type.OBJECT,
      properties: {
        fontFamily: { type: Type.STRING },
        headingWeight: { type: Type.STRING },
        googleFontUrl: { type: Type.STRING }
      },
      required: ["fontFamily", "googleFontUrl"]
    },
    sampleContent: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        subtitle: { type: Type.STRING },
        buttonLabel: { type: Type.STRING }
      }
    },
    uiTraits: {
      type: Type.OBJECT,
      properties: {
        borderRadius: { type: Type.STRING },
        borderWidth: { type: Type.STRING },
        shadow: { type: Type.STRING },
        spacing: { type: Type.STRING }
      }
    }
  },
  required: ["id", "name", "description", "prompt", "colors", "typography"]
};

export const generateDesignTemplates = async (
  userPrefs: string = ""
): Promise<UIDesignStyle[]> => {
  try {
    const prompt = `SaaS UI案を10個、JSONで生成。各案に詳細な'prompt'を含めて。要望: ${userPrefs}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: designStyleSchema },
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return safeJsonParse(response.text || "[]");
  } catch (e) {
    return handleApiError(e);
  }
};

export const extractDesignFromImage = async (
  base64Image: string
): Promise<ExtractedDesign> => {
  try {
    const prompt = `この画像からUI要素（カラー、フォント、雰囲気、構成、生成用プロンプト）を分析してJSONで返せ。`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            colors: { type: Type.ARRAY, items: { type: Type.STRING } },
            typography: { type: Type.STRING },
            vibe: { type: Type.STRING },
            composition: { type: Type.STRING },
            prompt: { type: Type.STRING }
          },
          required: ["colors", "typography", "vibe", "prompt"]
        },
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return safeJsonParse(response.text || "{}");
  } catch (e) {
    return handleApiError(e);
  }
};

export const generateProjectTree = async (
  formData: { name: string; features: string; notes: string; deploy: string },
  theme: string
): Promise<ProjectTreeNode> => {
  try {
    const prompt = `アプリ構造を「strategy」「design」「implementation」の3カテゴリで構成。プロジェクト名: ${formData.name}, 要望: ${formData.notes}, テーマ: ${theme}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "スキルツリー設計士。全てのノードに'category'を割り当て、ツリー状のJSONを返せ。",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            children: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, category: { type: Type.STRING } } } }
          },
          required: ["id", "name", "category"]
        },
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return safeJsonParse(response.text || "{}");
  } catch (e) {
    return handleApiError(e);
  }
};

export const modifyProjectTree = async (
  currentTree: ProjectTreeNode,
  userMessage: string
): Promise<{ tree: ProjectTreeNode; feedback: string }> => {
  try {
    const prompt = `現状: ${JSON.stringify(currentTree)}\n指示: "${userMessage}"\n\nツリー更新と解説(feedback)を日本語で返せ。簡潔に。`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "ソフトウェアアーキテクト。構造更新と意図の解説をセットでJSONで返せ。カテゴリ厳守。",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tree: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, category: { type: Type.STRING }, children: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, category: { type: Type.STRING } } } } } },
            feedback: { type: Type.STRING }
          },
          required: ["tree", "feedback"]
        },
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return safeJsonParse(response.text || "{}");
  } catch (e) {
    return handleApiError(e);
  }
};
