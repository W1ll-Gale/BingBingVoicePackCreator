# BingBongVoiceLineAPI

This is a modding framework to allow easy access for adding additional/replacing voice lines and subtitles of bing bongs responses without requiring **ANY** code to be written. This is perfect for translating bing bongs responses (see [here](https://thunderstore.io/c/peak/p/OracleTeam/PEAK_French_Quebec_Translation/) for an example of this) or just adding funny lines for bing bong to say. 


## <ins>Usage/Dev Info</ins>


### Option A -  Auto Generate Mod Package

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


### Option B - Manual Mod Package Creation

1. Make sure you have this mod installed.
2. Create a new mod folder in your thunderstore/r2modman profile to do this open up your mod profile folder and find the bellow, creating the new folder in place of `YourModName`:
```
BepInEx/
└── plugins/
    └── YourModName/
```

3. In the mod folder you just created, add a new text file named `response_sound_pack.json`, ensure the file extention is type `.json` or use the mod config generator [here](https://bingbong.mrbytesized.com/).
4. Add any audio files you want to be BingBong responses into this folder as well (_not required if you generated it with the website_).
5. Edit the `response_sound_pack.json` and include any audio files you want to be used, Here is an example config (_not required if you generated it with the website_):
```json
{
  "name": "ExampleModName",
  "entries": [
    {
      "file": "ExampleMP3AudioFile.mp3",
	  "subtitle": "Example subtitles for bing bong"
    },
    {
      "file": "ExampleWAVAudioFile.wav"
	  //This will automatically make the subtitles blank
    }
  ]
}
``` 

Save and you are all ready to go!

### _NOTE_

- **ALL** players must have the same mod and same config settings for it to by synced between players.

- If you are making a bing bong translation mod ensure all the entries are in the exact same order as the original if you intend having people with and without the mod syncing. 
_I might add a config input to state its a translation to ensure correct mapping, I will also try and include some more information about the correct formatting for a translation mod and in general this has not been tested much by me so to ensure syncing its best to just have everyone include the same mod_ 

_To make this easier you can create your own [thunderstore](https://thunderstore.io/c/peak/) mod following information [here](https://thunderstore.io/c/peak/create/docs/) with this mod as a dependency in the `manifest.json` file and packaged with the `response_sound_pack.json` and all audio files in the zip too._    

- You **CAN** install or create multiple mods which use this API to add custom responses. 

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

## <ins>Configuration</ins>

This mod has a config to change settings which supports in game config editing with [ModConfig](https://thunderstore.io/c/peak/p/PEAKModding/ModConfig/).

The config includes these settings:

- `Enable Bing Bong Voice Line API`: This allows for the mod to be enabled and disabled at any time (even in game) without disabling the mod physically.

- `Replace Bing Bong Responses`: If enabled, custom responses will replace the default Bing Bong responses instead of being added to them. 									

_NOTE: This is not synced between players so ensure all players have the same config setting._


## <ins>Future Plans</ins>

- Adding a scriptable pipeline to the API so BingBong responses can be changed based on any actions via code (possibly a similar system to `loaforcsSoundAPI`). 
- Adding config syncing between players in a lobby.
- Adding support for youtube videos via links.

## <ins>Issues</ins>

If I have missed any upgrades or you find any bugs feel free  to open an issue on the [GitHub repository](https://github.com/W1ll-Gale/BingBongVoiceLineAPI) or message me on discord (@`mrbyte.exe`) and i will try my best to fix any issues or update the mod for future updates.
