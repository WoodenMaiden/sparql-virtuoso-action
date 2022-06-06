FROM openlink/virtuoso-opensource-7

COPY virtuoso.ini /database
COPY populate.sh /populate.sh
COPY entrypoint.sh /entrypoint.sh
COPY triples.csv /triples.csv

ENTRYPOINT [ "/entrypoint.sh" ] 
CMD [ "password", "password", "/triples.csv" ]  
