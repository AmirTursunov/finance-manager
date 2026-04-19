import { Telegraf } from 'telegraf';
import { prisma } from './db';
import { transcribeAudio, parseFinanceText } from './ai-service';
import https from 'https';
import fs from 'fs';
import path from 'path';

export const initBot = (io: any) => {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string);

  bot.start(async (ctx) => {
    await ctx.reply("Assalomu alaykum! Xarajat va Daromadlarni Boshqarish tizimiga xush kelibsiz. \n\nMenga matn yoki ovozli xabar orqali tranzaksiyalaringizni yozib qoldirishingiz mumkin. \nMasalan: 'Ofis ijarasiga 500 dollar to\\'ladik' yoki '100 ming so\\'m daromad tushdi'.");
  });

  const downloadFile = (url: string, dest: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest);
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download file: ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
    });
  };

  const processText = async (ctx: any, text: string) => {
    try {
      await ctx.reply("🔍 Analiz qilinmoqda...");
      const categories = await prisma.category.findMany();
      const catNames = categories.map(c => c.name);

      const parsed = await parseFinanceText(text, catNames);
      
      if (!parsed || parsed.type === "unknown") {
        return ctx.reply("❌ Kechirasiz, xabaringizni tushunmadim. Iltimos, summa va maqsadini (masalan: 'Tushlikka 50 ming') aniqroq yozing.");
      }

      if (parsed.type === "analytics") {
        return ctx.reply("📊 Hisobotlarni ko'rish uchun Web Dashboard'ga kiring. U yerda barcha grafiklar va batafsil tahlil mavjud.");
      }

      if (!parsed.amount || isNaN(Number(parsed.amount))) {
        return ctx.reply("⚠️ Xabarda summa aniqlanmadi. Iltimos, raqamlar bilan summani ko'rsating.");
      }

      let cat = null;
      if (parsed.category) {
        cat = categories.find(c => c.name.toLowerCase() === parsed.category?.toLowerCase());
      }
      
      if (!cat) {
        cat = categories.find(c => (c as any).type === parsed.type) || categories.find(c => c.name === 'Boshqa') || categories[0];
      }

      // Ensure Tashkent Time (UTC+5)
      const now = new Date();
      const uzTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);

      const tx = await prisma.transaction.create({
        data: {
          amount: Number(parsed.amount),
          type: parsed.type,
          note: parsed.note || '-',
          categoryId: cat?.id,
          date: uzTime
        }
      });

      io.emit('transaction_updated');

      const timeStr = uzTime.toISOString().replace(/T/, ' ').replace(/\..+/, '').split(' ')[1].slice(0, 5);
      const typeUz = parsed.type === 'income' ? '📈 Kirim' : '📉 Chiqim';
      await ctx.reply(`${typeUz} ✅ Saqlandi!\n\n💰 Summa: ${Number(parsed.amount).toLocaleString()} so'm\n📂 Kategoriya: ${cat?.name || 'Boshqa'}\n📝 Izoh: ${parsed.note || '-'}\n🕒 Vaqt: ${timeStr}`);
    } catch (error) {
      console.error('Process error:', error);
      ctx.reply("❌ Amaliyotni bajarishda xatolik yuz berdi. Iltimos, bir ozdan so'ng qayta urinib ko'ring.");
    }
  };

  bot.on('text', async (ctx) => {
    await processText(ctx, (ctx.message as any).text);
  });

  bot.on('voice', async (ctx) => {
    const fileName = `voice_${ctx.message.message_id}.ogg`;
    const tempPath = path.join(process.cwd(), fileName);
    try {
      await ctx.reply("🎙 Ovozli xabar qabul qilindi, tahlil qilinmoqda...");
      const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
      
      // Download voice file with proper Promise
      await downloadFile(link.href, tempPath);
      
      // Transcribe using Whisper
      const text = await transcribeAudio(tempPath);
      
      if (!text || text.trim().length === 0) {
        return ctx.reply("❌ Ovozni matnga o'girib bo'lmadi. Iltimos, aniqroq gapiring.");
      }

      await ctx.reply(`📝 Tanishilgan matn: "${text}"`);
      await processText(ctx, text);

    } catch (e) {
      console.error('Voice processing error:', e);
      ctx.reply("❌ Ovozli xabarni qayta ishlashda xatolik yuz berdi.");
    } finally {
      // Cleanup
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  });

  return bot;
};


export const launchBot = async (bot: Telegraf) => {
  const externalUrl = process.env.RENDER_EXTERNAL_URL;
  
  // Prevent any unhandled telegram errors from crashing the process
  bot.catch((err: any) => {
    if (err.response?.error_code === 409) {
      console.log('⚠️ Telegram Conflict (409) swallowed - Normal during redeploy');
    } else {
      console.error('❌ Telegram error:', err);
    }
  });

  try {
    if (externalUrl) {
      const webhookUrl = `${externalUrl}/api/telegraf-webhook`;
      console.log(`📡 Registering Webhook: ${webhookUrl}`);
      
      // Delete existing potential polling and set new webhook
      await bot.telegram.deleteWebhook({ drop_pending_updates: true });
      await bot.telegram.setWebhook(webhookUrl);
      
      console.log(`✅ Bot Webhook registered successfully`);
    } else {
      // Local development only
      bot.launch();
      console.log('🤖 Bot launched in Polling mode (Dev)');
    }
  } catch (error: any) {
    if (error.response?.error_code === 409) {
       console.log('⚠️ Conflict during launch - new instance taking charge');
    } else {
      console.error('❌ Failed to launch bot:', error);
    }
  }
};
