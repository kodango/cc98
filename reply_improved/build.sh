#!/bin/bash

SRC_DIR=$(dirname $0)
BUILD_DIR="$SRC_DIR/reply_improved"
VERSION=""

if [ ! -d $BUILD_DIR ]; then
    echo "Create build directory $BUILD_DIR"
    mkdir -p $BUILD_DIR
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
sed -i "/version=/s/version='[0-9.]\+'/version='$VERSION'/" updates.xml

echo "Copy source files.."
cp -rf images rim.css jquery.min.js lscache.js manifest.json reply_improved.user.js $BUILD_DIR

echo "Remove debug matches (localhost)"
sed -i "/localhost\/cc98/d" $BUILD_DIR/manifest.json
#sed -i "/localhost\/cc98/d" $BUILD_DIR/manifest.xml
