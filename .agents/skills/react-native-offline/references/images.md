# Images

An expense tracker shows few images. Today the web app uses icons and colors for tags and vaults, not photos. Read this only if the app adds receipt attachments or user-picked images. Whether to add receipts is an open product decision.

## Rules

1. Import `Image` from `expo-image`, not from `react-native`. Use `contentFit="cover"`, not `resizeMode`. Check the docs for the installed SDK, since APIs change.
2. Put the size on the `Image` itself: `width`, `height` or `aspectRatio`, `borderRadius` and a placeholder `backgroundColor`.
3. Overlays (a "Remove" button, a badge) are absolute siblings of the `Image` inside a plain wrapper `View` with no style.
4. Do not stretch an image with `StyleSheet.absoluteFill` inside a rounded wrapper with `overflow: "hidden"`. See "Known failure" below.
5. `StyleSheet.absoluteFillObject` may be removed in newer React Native versions. If it is missing, spread `StyleSheet.absoluteFill` instead. Check the installed version.
6. Give every image explicit dimensions so layout does not jump when it loads. In list rows, show a small thumbnail, not the full file.

## Pattern

A receipt preview on the add-transaction screen:

```tsx
import { Image } from "expo-image";

<View>
  <Image source={{ uri: receiptUri }} style={s.receipt} contentFit="cover" accessibilityLabel="Receipt photo" />
  <Pressable accessibilityRole="button" accessibilityLabel="Remove receipt" onPress={() => setReceiptUri(null)} style={s.remove}>
    <Text style={s.removeText}>Remove</Text>
  </Pressable>
</View>

receipt: { width: "100%", aspectRatio: 4 / 3, borderRadius: ms(20), backgroundColor: color.track },
remove: { position: "absolute", top: ms(10), right: ms(10) /* ... */ },
```

## Known failure

This was seen in an earlier app on an Android phone (Expo Go): the layout below showed only the grey placeholder, and nothing inside the wrapper was drawn, including the overlay button.

```tsx
<View style={{ aspectRatio: 4 / 3, borderRadius: 20, backgroundColor: color.track, overflow: "hidden" }}>
  <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" /> {/* react-native Image */}
  <Pressable style={s.remove}>...</Pressable>
</View>
```

Switching to the pattern above fixed it, but two changes went in together, so it is not proven which one mattered. Use the pattern above for both parts. Re-verify on your SDK version.

## Debugging a blank image

Add temporary handlers to tell a load failure apart from a rendering problem:

```tsx
onLoad={(e) => console.log("image loaded", e.nativeEvent)}
onError={(e) => console.warn("image failed", e.nativeEvent.error)}
```

- `onError` fires: the URI or the decode is the problem.
- `onLoad` fires but nothing shows: layout or clipping. Check whether sibling overlays are visible too.
- Neither fires: the image never got a size or never mounted.

Remove the handlers once the cause is known.

## Picked images and local storage

- A `uri` from `expo-image-picker` points to the app cache, which the OS can clear. If a receipt must survive, copy it to the app's document directory (`expo-file-system`) and store only the path in SQLite. Check the docs for the current API.
- Receipts are private financial data. Keep them on the device, and include them in the backup and export design from `references/offline-data.md`, or tell the user they are excluded.
- Do not store the full-size original if a downscaled copy is enough. Whether to downscale is a product decision.
