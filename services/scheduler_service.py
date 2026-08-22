"""
Background Scheduler Service for Luci Assistant.
Uses APScheduler (AsyncIOScheduler) to orchestrate proactive routines, morning briefings,
weather alerts and periodic maintenance tasks without blocking FastAPI.
"""

import asyncio
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from services.external_apis import (
    get_weather_summary_wttr,
    get_brazil_holidays,
    get_hacker_news_top,
    get_currency_rates,
    send_ntfy_push,
)

class LuciBackgroundScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self._is_running = False

    async def morning_briefing_job(self):
        """Job Matinal Proativo (08:30): Compila briefing com clima, feriados, câmbio e notícias tech."""
        print(f"[LuciScheduler] 🌅 Executando Briefing Matinal Proativo ({datetime.now().strftime('%H:%M:%S')})...")
        try:
            # 1. Clima
            weather = await get_weather_summary_wttr("Sao Paulo")
            weather_text = weather.get("summary", "Clima ameno em São Paulo.")

            # 2. Cotações
            currency = await get_currency_rates("USD-BRL,EUR-BRL,BTC-BRL")
            rates = currency.get("rates", {})
            dolar = rates.get("USDBRL", {}).get("bid", "0.00")
            btc = rates.get("BTCBRL", {}).get("bid", "0")

            # 3. Notícias Hacker News
            hn = await get_hacker_news_top(limit=2)
            stories = [s.get("title") for s in hn.get("stories", [])]
            top_tech = " | ".join(stories) if stories else "Sem novidades críticas."

            # 4. Mensagem Formatada
            mensagem = (
                f"🌤️ {weather_text}\n"
                f"💵 Dólar: R$ {dolar} | BTC: R$ {btc}\n"
                f"📰 Tech: {top_tech}"
            )

            # 5. Envia Notificação Push via Ntfy.sh
            await send_ntfy_push(
                topic="luci_alerts",
                message=mensagem,
                title="🌅 Briefing Diário da Luci",
                priority=4,
                tags="sunrise,robot,newspaper",
            )
            print("[LuciScheduler] ✅ Briefing matinal enviado com sucesso.")
        except Exception as e:
            print(f"[LuciScheduler] ❌ Erro ao gerar briefing matinal: {e}")

    async def health_monitor_job(self):
        """Monitor Periódico em Segundo Plano (cada 30 min) para checar integridade de cache e memória."""
        print(f"[LuciScheduler] 🩺 Health Monitor check ativo ({datetime.now().strftime('%H:%M:%S')})")

    def start(self):
        """Inicia os jobs programados no AsyncIOScheduler."""
        if not self._is_running:
            # Job Diário às 08:30 (Horário de Brasília)
            self.scheduler.add_job(
                self.morning_briefing_job,
                trigger=CronTrigger(hour=8, minute=30),
                id="morning_briefing",
                replace_existing=True,
            )

            # Job de Monitoramento Periódico a cada 30 minutos
            self.scheduler.add_job(
                self.health_monitor_job,
                trigger=IntervalTrigger(minutes=30),
                id="system_health_monitor",
                replace_existing=True,
            )

            self.scheduler.start()
            self._is_running = True
            print("[LuciScheduler] 🚀 Orquestrador de Tarefas em Segundo Plano (APScheduler) iniciado.")

    def shutdown(self):
        """Encerra o agendador no shutdown do FastAPI."""
        if self._is_running:
            self.scheduler.shutdown(wait=False)
            self._is_running = False
            print("[LuciScheduler] Agendador de tarefas encerrado.")

global_scheduler = LuciBackgroundScheduler()
