#!/bin/bash

SRC_DIR=$(dirname $0)
CHROME_BUILD_DIR="$SRC_DIR/reply_improved"
SOGOU_BUILD_DIR="$SRC_DIR/reply_improved_sogou"
VERSION=""

if [ ! -d $CHROME_BUILD_DIR ]; then
    echo "Create chrome build directory $CHROME_BUILD_DIR"
    mkdir -p $CHROME_BUILD_DIR
fi

if [ ! -d $SOGOU_BUILD_DIR ]; then
    echo "Create sogou build directory $SOGOU_BUILD_DIR"
    mkdir -p $SOGOU_BUILD_DIR
fi

cd $SRC_DIR

echo "Generate meta.js file"
sed -n 'p;/==\/UserScript/q' reply_improved.user.js > reply_improved.meta.js

echo -n "Parse version number: "
VERSION=$(grep "@version" reply_improved.user.js | awk '{print $3}')
echo $VERSION

echo "Update manifest file version"
sed -i "/\"version\"/s/[0-9.]\+/$VERSION/" manifest.json
sed -i "/<version>/s/[0-9.]\+/$VERSION/" manifest.xml
sed -i "/<updatecheck/s/version='[0-9.]\+'/version='$VERSION'/" updates.xml

echo "Copy source files to build directory"
cp -rf images rim.css jquery.min.js lscache.js manifest.json reply_improved.user.js $CHROME_BUILD_DIR
cp -rf images rim.css jquery.min.js lscache.js manifest.xml reply_improved.user.js $SOGOU_BUILD_DIR

echo "Remove debug matches (localhost)"
sed -i "/localhost\/cc98/d" $CHROME_BUILD_DIR/manifest.json
sed -i "/localhost\/cc98/d" $SOGOU_BUILD_DIR/manifest.xml

echo "Package chrome extension"
#chrome --no-message-box --pack-extension=$CHROME_BUILD_DIR --pack-extension-key=$SRC_DIR/reply_improved.pem
#chrome --pack-extension=$CHROME_BUILD_DIR --pack-extension-key=$SRC_DIR/reply_improved.pem
winrar a -afzip -ep1 reply_improved.zip $CHROME_BUILD_DIR/*
buildcrx reply_improved.zip reply_improved.pem reply_improved.crx

echo "Package sogou explore extension"
winrar a -afzip -ep1 reply_improved.sext $SOGOU_BUILD_DIR/*
