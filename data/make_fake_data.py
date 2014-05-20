import sys
from datetime import datetime, date, timedelta
import json
from random import random
import argparse

parser = argparse.ArgumentParser(description="Fake data maker.")
parser.add_argument('-s', '--start', help="start date", nargs=1)
parser.add_argument('-d', '--small', help="allow decimal values", action="store_true")
parser.add_argument('-r', '--range', help="how many days from start date", nargs=1)
parser.add_argument('-m', '--magnitude', help="size of change", nargs=1)
parser.add_argument('-p', '--percentage', help="whether or not this is a percentage", action="store_true")
parser.add_argument('-n', '--let_negative', help="let the data values go negative", action="store_true")
parser.add_argument('-v', '--start_value', help='start value', nargs=1)
args = parser.parse_args()

doy = {
	0: 1,
	1:.9,
	2:1,
	3:1.1,
	4:1.05,
	5:.7,
	6:.75
}
if args.percentage: convert = lambda x: float(x)
elif args.small:    convert = lambda x: float(x)
else:               convert = lambda x: int(x)

current_date = datetime.strptime(args.start[0], '%Y-%m-%d').date()
length     = int(args.range[0])

baseline = convert(args.start_value[0])

if   args.magnitude:  magnitude = convert(args.magnitude[0])
elif args.percentage: magnitude = baseline/50.
elif args.small:      magnitude = baseline/20.	
else:                 magnitude = baseline/5
out = []

# Needed to automatically convert dates to strings in json. 
dthandler = lambda obj: obj.isoformat() if isinstance(obj, date) else None

for i in xrange(length):
	out.append({'date': current_date, 'value': baseline})
	nb = convert(magnitude * (random()-.5))
	if args.percentage:
		if (baseline+nb < 0 or baseline+nb > 1) and (not args.let_negative): pass
		else: baseline += nb
	else:
		if baseline+nb < 0 and not args.let_negative: pass
		else: baseline += nb

	current_date += timedelta(days=1)

sys.stdout.write(json.dumps(out,default=dthandler, indent=4))