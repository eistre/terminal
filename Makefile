# DOCKER TASKS
os: 
	$(MAKE) -C dockerStuff up

web:
	$(MAKE) -C webpage run

web2:
	$(MAKE) -C webpage3.0 run