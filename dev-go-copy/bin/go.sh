#!/bin/bash
RED='\e[0;31m'
YELLOW='\e[0;33m'
GREEN='\e[0;32m'
BOLD='\e[1m'
DIM='\e[2m'
NC='\e[0m' # No Color

REPLAY=0

while getopts ":r" opt
do
	case "$opt" in
		r ) REPLAY=1 ;;
	esac
done

LAST_COMMAND_FILE=./go.last-command.tmp
EXIT_CODE=0
if [[ -f $LAST_COMMAND_FILE && "$REPLAY" -eq "1" ]]; then
	printf "${YELLOW}Replaying last command from file : ${BOLD}$LAST_COMMAND_FILE${NC}\n"
else
	rm $LAST_COMMAND_FILE
	npx --node-arg "--trace-warnings" go-core $@
	EXIT_CODE=$?
fi

if [[ "$EXIT_CODE" -eq "0" ]]; then
	if test -f "$LAST_COMMAND_FILE"; then
		printf "\n${DIM}-----------------------------------------------${NC}\n"
		printf "${GREEN}GO Dev Cli: Executing the following commands...${NC}\n"
		printf "${DIM}-----------------------------------------------${NC}\n"
		LAST_COMMAND=$(<$LAST_COMMAND_FILE)
		printf "${DIM}$LAST_COMMAND${NC}\n"
		printf "${DIM}-----------------------------------------------${NC}\n\n"
		eval $LAST_COMMAND
	else
		printf "\n${YELLOW}User cancelled.\n"
		exit 1
	fi
else
	exit $EXIT_CODE
fi
