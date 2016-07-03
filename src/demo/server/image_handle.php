<?php
if(isset($_GET["new"])&&$_GET["new"]==true){
	unset($_SESSION["newPath"]);
	unset($_SESSION["fileExt"]);
}
if (isset($_POST["upload_form_submitted"])) {
	if (!isset($_FILES['img_upload'])||empty($_FILES['img_upload']['name'])) {
		$error="ERROR: you didn't uplad a file";
	}
	else if(!isset($_POST['img_name'])||empty($_POST['img_name']||empty($_FILES['img_upload']['name']))){
		$error="ERROR: you didn't specify a file name";
	}
	else {		
		$allowedMIMEs=array('image/jpeg','image/gif','image/png');
		foreach ($allowedMIMEs as $mime) {
			if($mime==$_FILES['img_upload']['type']){
				$mimeSplitter=explode('/',$mime);
				$fileExt=$mimeSplitter[1];
				$newPath='img/'.$_POST['img_name'].'.'.$fileExt;
				break;
			}
		}

		if (!isset($newPath)) {
				$error="ERROR: Invalid file format";
		}else if (file_exists($newPath)) {
			$error="ERROR: a file with that name already exist";
		}
		elseif (!copy($_FILES['img_upload']['tmp_name'],$newPath)) {
			$error="ERROR: could not save file to server";
		}
		else {
			$_SESSION['newPath']=$newPath;
			$_SESSION['fileExt']=$fileExt;
		}
	}
			
}


if(isset($_GET["crop_attempt"])){
	switch ($_SESSION["fileExt"]) {
		case 'jpg':
		case 'jpeg':
			$source_img=imagecreatefromjpeg($_SESSION["newPath"]);
			$dest_img=imagecreatetruecolor($_GET["crop_w"],$_GET["crop_h"]);	//必须是truecolor
			break;
		case 'gif':
			$source_img=imagecreatefromgif($_SESSION["newPath"]);
			$dest_img=imagecreate($_GET["crop_w"],$_GET["crop_h"]);
			break;
		case 'png':
			$source_img=imagecreatefrompng($_SESSION["newPath"]);
			$dest_img=imagecreate($_GET["crop_w"],$_GET["crop_h"]);
			break;
		default:
			break;
	}
	imagecopy($dest_img,$source_img,0,0,$_GET["crop_l"],$_GET["crop_t"],$_GET["crop_w"],$_GET["crop_h"]);
	switch ($_SESSION["fileExt"]) {
		case 'jpg':
		case 'jpeg':
			imagejpeg($dest_img,$_SESSION["newPath"]);
			break;
		case 'gif':
			imagegif($dest_img,$_SESSION["newPath"]);
			break;
		case 'png':
			imagepng($dest_img,$_SESSION["newPath"]);
			break;
		default:
			break;
	}
	imagedestroy($dest_img);
	imagedestroy($source_img);
	header("Location:index.php?preview=".$_SESSION['newPath']);
}
?>