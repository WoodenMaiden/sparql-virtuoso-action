FROM openlink/virtuoso-opensource-7

COPY virtuoso.ini /database
COPY populate.sh /populate.sh
COPY triples.csv /triples.csv

ENV DBA_PASSWORD="password"

ENTRYPOINT [ "/populate.sh" ] 
CMD [ "/triples.csv" ]  
