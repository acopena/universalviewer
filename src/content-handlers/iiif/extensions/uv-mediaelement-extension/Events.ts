export class MediaElementExtensionEvents {
  static namespace: string = "mediaelementExtension.";

  static MEDIA_ENDED: string = MediaElementExtensionEvents.namespace + "mediaEnded";
  static MEDIA_PAUSED: string = MediaElementExtensionEvents.namespace + "mediaPaused";
  static MEDIA_PLAYED: string = MediaElementExtensionEvents.namespace + "mediaPlayed";
  static MEDIA_TIME_UPDATE: string = MediaElementExtensionEvents.namespace + "mediaTimeUpdate";
  static MEDIA_FORWARD: string = MediaElementExtensionEvents.namespace + "mediaForward";
  static MEDIA_BACKWARD: string = MediaElementExtensionEvents.namespace + "mediaBackward";
}
