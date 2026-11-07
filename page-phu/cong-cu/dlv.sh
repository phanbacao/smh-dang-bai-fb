#!/bin/bash
n=$1; id=$(sed -n "$((n+1))p" vids.tsv | cut -f1); out=vraw/$n.mov
[ -s "$out" ] && exit 0
curl -s -L -o "$out" --max-time 240 "https://drive.usercontent.google.com/download?id=$id&export=download&confirm=t"
