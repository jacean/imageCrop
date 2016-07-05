<?php
session_start();
require_once 'server/image_handle.php';
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>image handle</title>
    <link rel="stylesheet" href="css/main.css">
    <script src="../../dist/imagecrop-1.0.0/js/jquery.min.js"></script>
    <script src="../script/jCrop.js"></script>
    <link rel="stylesheet" href="../../dist/imagecrop-1.0.0/css/jCrop.css">
</head>
<body>
    <h1>
        图片上传&操作
    </h1>
    
    <?php 
        if (!isset($_SESSION['newPath'])||isset($_GET['new'])) {       
    ?>
    
    <?php 
    if(isset($error)) echo '<p>'.$error.'</p>';
    ?>

    <form action="index.php" method="POST" enctype="multipart/form-data" id="imgform">
        <label for="img_upload">choose image to upload</label>
        <input type="file" name="img_upload" id="img_upload">
        <label for="img_name">set image name</label>
        <input type="text" name="img_name" id="img_name">
        <input type="submit" name="upload_form_submitted">
    </form>
    <?php
        }else {
    ?>
    <div style="padding:10px;">
    <img id="uploaded_image"  alt="" />
    <div id="preview_image" ></div>
   </div>
    
        <script>
        var image='<?php echo $_SESSION['newPath']."?".rand(0,10000); ?>';
        jCrop.init("uploaded_image",image);
        jCrop.config.maskEnable=true;
        jCrop.config.previewEnable=false;
        jCrop.initPreview("preview_image");
        // jCrop.config.fixRatio=true;
        jCrop.setPreDivRect(500,100);
        function crop(){
            var coord=jCrop.crop();
            location.href = "index.php?crop_attempt=true&crop_l=" + coord.left + "&crop_t=" + coord.top + "&crop_w=" + coord.width + "&crop_h=" + coord.height;
        }
        function cancel(){
            jCrop.cancel();
        }

       toggle=function(o){
            if(o)return false;
            else return true;
        }
        function setRatio(){
            jCrop.config.whRatio=$('#ratio').val().split(',');
        }
        (function getRect(){
            setInterval(function(){
                $("#crop_rect").text(JSON.stringify(jCrop.crop()));
            },1000);
        })();
    </script>   
    <div>
    <p id="crop_rect"></p>
    <button onclick="jCrop.config.flowEnable=toggle(jCrop.config.flowEnable)">flow</button>
    <button onclick="jCrop.config.maskEnable=toggle(jCrop.config.maskEnable)">mask</button>
    <button onclick="jCrop.config.dragEnable=toggle(jCrop.config.dragEnable)">drag</button>
    <button onclick="jCrop.config.fixRatio=toggle(jCrop.config.fixRatio)">fixRatio</button>
    <input id="ratio" type="text" /> <button onclick="setRatio()">setratio</button>
    <button onclick="jCrop.config.previewEnable=toggle(jCrop.config.previewEnable)">previewToggle</button>
    <button onclick="jCrop.refresh()">refresh</button>
    <button onclick="crop();">confirm crop</button>
    <button onclick="cancel();">cancel crop</button>
    </div>
    <p>
    <a href="index.php?new=true">start over with new image</a>
    </p>
    
    <?php } ?>


</body>

</html>