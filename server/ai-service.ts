import fs from 'fs';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export const transcribeAudio = async (filePath: string) => {
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ Missing GROQ_API_KEY');
    return null;
  }
  
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-large-v3',
      language: 'uz',
      prompt: "Xom-ashyo, ijara, oylik maosh, tushum, kirim, chiqim, xarajatlar, qarzlar, aksiya, premmiya, shtraf, nalog, bojxona, sklad, tashuvchi, foiz, plastik, naqd, dollar, million, milliard."
    });
    return transcription.text;
  } catch (error) {
    console.error('Groq Transcription error:', error);
    return null;
  }
};

export const parseFinanceText = async (text: string, categories: string[]) => {
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ Missing GROQ_API_KEY');
    return null;
  }

  try {
    const prompt = `
      Foydalanuvchining moliya haqidagi xabarini tahlil qiling va ma'lumotlarni ajrating.
      
      MUHIM KO'RSATMALAR:
      1. Terminologiya: "Xom-ashyo", "Aksiya", "Shtraf" kabi biznes so'zlarini to'g'ri talqin qiling.
      2. Sonlar: Agar foydalanuvchi "million" yoki "milliard" desa, ularni to'liq songa aylantiring. 
         Masalan: "5 million" -> 5000000, "1.5 million" -> 1500000.
      3. Valyuta: 
         - Agar $ (dollar) bo'lsa, 12,800 so'mdan hisoblang.
         - Agar "so'm", "million" yoki shunchaki son bo'lsa, uni O'zbek so'mida deb hisoblang.
      4. Xatolarni tuzatish: Transkripsiyadagi xatolarni (masalan: "Xa ma shia" -> "Xom-ashyo", "Ak sia" -> "Aksiya") mantiqan to'g'rilang.

      Javobni FAQAT quyidagi JSON formatida qaytaring:
      {
        "type": "income" | "expense" | "analytics" | "unknown",
        "amount": number, // FAQAT SO'MDA (millionlar hisoblangan holatda)
        "category": "category name" | null,
        "note": "Izoh (To'g'ri so'zlar bilan yozing, masalan: 'Aksiya uchun 5 mln so'm')"
      }
      
      Mavjud kategoriyalar: ${categories.join(', ')}.
      
      Foydalanuvchi matni: "${text}"
    `;


    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) return null;

    try {
      const result = JSON.parse(content);
      // Ensure amount is a number
      if (result.amount && typeof result.amount === 'string') {
        result.amount = parseFloat(result.amount.replace(/[^0-9.]/g, ''));
      }
      return result;
    } catch (parseErr) {
      console.error('JSON Parse error from Groq:', parseErr);
      return null;
    }
  } catch (error) {
    console.error('Groq NLP Parse error:', error);
    return null;
  }
};

/**
 * AI Financial Advisor - Strategic Analysis
 */
export const getFinancialAdvisorAdvice = async (query: string, data: any) => {
  if (!process.env.GROQ_API_KEY) return "API Key topilmadi.";

  try {
    const prompt = `
      Siz O'zbekistondagi kichik va o'rta bizneslar uchun professional Moliyaviy Maslahatchi va Biznes Analitiksiz.
      Ismingiz: "FinanceAI".
      
      Sizga foydalanuvchining moliyaviy ma'lumotlari taqdim etiladi. Siz ushbu ma'lumotlarni tahlil qilib, foydalanuvchining savoliga aniq, raqamlar bilan asoslangan va professional tavsiyalar berishingiz kerak.
      
      MOLIYAVIY MA'LUMOTLAR:
      - Umumiy Kirim: ${data.totalIncome.toLocaleString()} so'm
      - Umumiy Chiqim: ${data.totalExpense.toLocaleString()} so'm
      - Sof Foyda: ${(data.totalIncome - data.totalExpense).toLocaleString()} so'm
      - Kategoriyalar bo'yicha tahlil: ${JSON.stringify(data.categoryBreakdown)}
      - Oxirgi 10 ta tranzaksiya: ${JSON.stringify(data.recentTransactions)}
      
      FOYDALANUVCHI SAVOLI: "${query}"
      
      KO'RSATMALAR (QAT'IY):
      1. QISQA, LONDA VA ANIQ JAVOB BERING. (Maksimal 3-5 ta gap).
      2. Har bir tranzaksiya haqidagi ma'lumot oxirida sanani mana bu formatda ko'rsating: "YYYY-MM-DD, 🕒 HH:mm" (masalan: 2026-04-19, 🕒 13:10).
      3. Ortiqcha so'zbozlik va kirish so'zlaridan qoching.
      4. Har bir gap yangi ma'lumot bersin.
      5. Faqat fakt va raqamlarga tayanib gapiring.
      6. Professional "Business Short" uslubida yozing.
    `;

    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Siz professional moliyaviy tahlilchisiz.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Advisor error:', error);
    return "Xizmatda xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.";
  }
};




