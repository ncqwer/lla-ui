const updateFloatValues = () => {
  // alert("updateFloatValues");
  updateDateTimeTextObj();
  //alert("floatmRIDs.length="+floatmRIDs.length);
  if (floatmRIDs == null || floatmRIDs.length === 0) {
    // alert(5);
    updateFloatIconValues();
  } else {
    let ycKey = floatmRIDs.join(',');
    this.queryRedisData(ycKey).then((redisValue) => {
      console.log('redisValue==========', redisValue);
      if (redisValue != null && svg_doc != null && ssTextObjList != null) {
        for (
          let i = 0;
          i < redisValue.length && i < ssTextObjList.length;
          i++
        ) {
          const textobj = ssTextObjList[i];
          if (textobj != null) {
            const val = eval(res.data.data[i]);
            textobj.firstChild.nodeValue = val.toFixed(
              floatParamObjList[i].wShowDotNum,
            );
          }
        }
      }
    });
  }
};
