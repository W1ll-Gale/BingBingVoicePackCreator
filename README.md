# BingBingVoicePackCreator

This is a website to make packaging mods using my [BingBongVoiceLineAPI](https://github.com/W1ll-Gale/BingBongVoiceLineAPI) extremely easy and error free. 


## <ins>Usage/Dev Info</ins>

[BingBong Voice Pack Creator](https://bingbong.mrbytesized.com/)

I have made a mod package generator to make using the mod much simpler, easier and hopefully reducing user error. The website has been designed with the ability to do everything for you, while also detecting any issues with your formatting or any spelling mistakes, for example when uploading the [PEAK French Quebec Translation](https://thunderstore.io/c/peak/p/OracleTeam/PEAK_French_Quebec_Translation/) mod package it detected that one of the audio files were misspelt in the config file (_p.s. if you are the creator of that mod bong_ou_ouini.wav is the audio file that is inconsistent between the mod config and the audio file name_).

Using the mod packager website you can:
- Upload your existing mod package `.zip` even if the mod does not use my mod, this will extract all the information and allow you to add my mod into your mod.
- Upload audio files and add subtitles if you wish.
- Add placeholder audio entries for audio files you will add later (_this only supports downloading the config file only and not fully packaging your mod).
- For more advanced users you can also use the live json editor to create or change the mod information instead of using the ui front end.
- You can select the option to create a full thunderstore/r2modman mod package that is ready to be uploaded. This lets you add, create or edit everything needed to make the mod package without editing any json.

Below is information on how to use the website:
1. Upload your auto files or add the name of your audio files. 
2. Add subtitles to your audio entries if you wish.
3. Choose if you want to just download the `response_sound_pack.json` config file and add the audio files manuallly later (ensure they are all spelt the exact same) or create a ready to upload thunderstore/r2modman mod package (only allowed when you uploaded the audio files).
4. If you chose to create a mod package fill in all the required details and any optional files or details you want to add.
5. Download your mod config file or mod package and upload your mod to thunderstore!

### _NOTE_

- Currently supports the following file types:
	- `.mp3`
	- `.wav`
	- `.ogg`
	- `.aiff`
	- `.aif`
	- `.xm`
	- `.mod`
	- `.it` 
	- `.s3m`

## <ins>Future Plans</ins>

- Adding ffmpeg.wasm natively in the website to upload other file formats not narively supported and converts in the website instead of being required in the mod.
- - Make a generic website similar to this one but just for general thunderstore mods.

## <ins>Issues</ins>

If I have missed any upgrades or you find any bugs feel free  to open an issue on the [GitHub repository](https://github.com/W1ll-Gale/BingBingVoicePackCreator/) or message me on discord (@`mrbyte.exe`) and i will try my best to fix any issues or update the mod packager for future updates.
