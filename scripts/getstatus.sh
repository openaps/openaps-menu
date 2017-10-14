#!/bin/bash

BG=$( cat ~/myopenaps/monitor/glucose.json | jq .[0].glucose )
touch -d "$(date -R -d @$(jq .[0].date/1000 ~/myopenaps/monitor/glucose.json))" ~/myopenaps/monitor/glucose.json
BGTIME=$( ls -la ~/myopenaps/monitor/glucose.json | awk '{print $6,$7,$8}' )
IOB=$( printf %.1f $(cat ~/myopenaps/monitor/iob.json | jq .[0].iob) )
IOBTIME=$( ls -la ~/myopenaps/monitor/iob.json | awk '{print $6,$7,$8}' )
COB=$( cat ~/myopenaps/monitor/meal.json | jq .mealCOB )
COBTIME=$( ls -la ~/myopenaps/monitor/meal.json | awk '{print $6,$7,$8}' )
TEMPRATE=$( printf %.1f $(cat ~/myopenaps/monitor/temp_basal.json | jq .rate ) )
TEMPDURATION=$( cat ~/myopenaps/monitor/temp_basal.json | jq .duration )
TEMPTIME=$( ls -la ~/myopenaps/monitor/temp_basal.json | awk '{print $6,$7,$8}' )
ENACTEDRATE=$( printf %.1f $(cat ~/myopenaps/enact/enacted.json | jq .rate ) )
ENACTEDDURATION=$( cat ~/myopenaps/enact/enacted.json | jq .duration )
ENACTEDTIME=$( ls -la ~/myopenaps/enact/enacted.json | awk '{print $6,$7,$8}' )
TIME=$( date +"%b %e %H:%M" )
printf "%-4s%4s%13s\n" "BG:" "$BG" "$BGTIME"
printf "%-4s%4s%13s\n" "IOB:" "$IOB" "$IOBTIME"
printf "%-4s%4s%13s\n" "COB:" "$COB" "$COBTIME"
echo Running temp:
printf "%-2s%-2s%3s%1s%13s\n" "$TEMPDURATION" "m" "$TEMPRATE" "U" "$TEMPTIME"
echo Last enacted temp:
printf "%-2s%-2s%3s%1s%13s\n" "$ENACTEDDURATION" "m" "$ENACTEDRATE" "U" "$ENACTEDTIME"
printf "%-8s%13s\n" "Now:" "$TIME"
