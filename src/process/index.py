from iqoptionapi.stable_api import IQ_Option
from datetime import datetime
from configs import IQ_USER, IQ_PWD, PARIDADES
import sys
import json
import time

SECONDS_DELAY = 5
MARTINGALES = 3
API = IQ_Option(IQ_USER, IQ_PWD)
API.connect()

def printer(msg):
  print(msg)
  sys.stdout.flush()

def get_best_payout():
  printer("Capturando payouts")
  inicio = time.time()
  actives = {}
  tb = API.get_all_profit()
  all_Asset=API.get_all_open_time()

  for x in PARIDADES:

    actives[x] = {'digital': False, "turbo": False, 'binary': False}

    if all_Asset['digital'][x]['open']:
      API.subscribe_strike_list(x, 5)
      tentativas = 0
      while True:
        d = API.get_digital_current_profit(x, 5)

        if d != False:
          d = int(d)
          break
        time.sleep(0.5)

        if tentativas == 5:
          d = 0
          break

        tentativas += 1
      API.unsubscribe_strike_list(x, 5)
      if d != 0:
        actives[x]['digital'] = int(d)

    if all_Asset['turbo'][x]['open'] and tb[x]['turbo']:
      actives[x]['turbo'] = int(tb[x]['turbo']*100)

    if all_Asset['binary'][x]['open'] and tb[x]['binary']:
      actives[x]['binary'] = int(tb[x]['binary']*100)

  printer("Payouts OK")
  return actives

payouts = get_best_payout()

# data = [{'par':'EURUSD', 'time':'04:10','action':'call','timeframe':5}]

data = json.loads(sys.argv[1])

actualSignals = {}

for x in data:
  if not x['time'] in actualSignals:
    actualSignals[x['time']] = []

  actualSignals[x['time']].append(x)

def operate(time):
  x = actualSignals[time][0]

  best = payouts[x['par']]

  if x['timeframe'] == 5:
    if best['digital'] and best['turbo']:
      if best['digital'] >= best['turbo']:
        best = 'digital'
      else:
        best = 'turbo'
    else:
      if best['digital']:
        best = 'digital'
      elif best['turbo']:
        best = 'turbo'
      else:
        return
  else:
    if best['digital'] and best['binary']:
      if best['digital'] >= best['binary']:
        best = 'digital'
      else:
        best = 'binary'
    else:
      if best['digital']:
        best = 'digital'
      elif best['binary']:
        best = 'binary'
      else:
        return

  for gale in range(MARTINGALES):
    
    amount = 2 * (2.2 ** gale)

    if best == 'digital':
      _, id = API.buy_digital_spot(x['par'].upper(), amount, x['action'].lower(),int(x['timeframe']))

      if isinstance(id, int):
        while True:
          status,lucro = API.check_win_digital_v2(id)
          if status:
            if lucro > 0:
              printer('RESULTADO: WIN / LUCRO: '+str(round(lucro, 2)))
              result = True
            else:
              printer('RESULTADO: LOSS GALE ' + str(gale + 1) + ' / LUCRO: -'+str(round(amount, 2)))
              result = False
            break
        if result or (result == False and gale == (MARTINGALES - 1)): 
          return

    elif best == 'turbo' or best == 'binary':
      status,id = API.buy(amount, x['par'].upper(), x['action'].lower(), int(x['timeframe']))

      if status:
        resultado,lucro = API.check_win_v3(id)
        
        printer('RESULTADO: '+resultado+' GALE ' + str(gale + 1) + '/ LUCRO: '+str(round(lucro, 2)))

        if resultado:
          result = True
        else:
          result = False

      if result or (result == False and gale == (MARTINGALES - 1)): 
          return

    else:
      print("Cancelado")

for x in data:
  if not x['time'] in actualSignals:
    actualSignals[x['time']] = []

  actualSignals[x['time']].append(x)

for x in actualSignals:
  while True:
    time.sleep(1)
    now = datetime.now().strftime('%H:%M:%S')
    atual = x.split(':')
    hora = int(atual[0])
    minuto = int(atual[1])
    if minuto - 1 < 0:
      if hora - 1 < 0:
        hora = 23
        minuto = 60 - 1
      else:
        hora = hora - 1
        minuto = 60 - 1
    else:
      minuto = minuto - 1

    date_string = str(hora).zfill(2) + ":" + str(minuto).zfill(2) + ":" + str(60 - SECONDS_DELAY).zfill(2)

    if now == date_string:
      operate(str(atual[0]).zfill(2) + ":" + str(atual[1]).zfill(2))
      break

    now = now.split(':')
    
    if hora > int(atual[0]) or (hora == int(atual[0]) and int(now[1]) > minuto) or (hora > int(atual[0])):
      break

printer('finished')
