import { CameraView, CameraProps, useCameraPermissions } from "expo-camera";
import { useState, useEffect, useRef } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, Modal, ScrollView, Alert } from "react-native";
import * as FileSystem from "expo-file-system";

export default function App() {
  const cameraRef = useRef<CameraView>(undefined);
  const [permission, requestPermission] = useCameraPermissions();
  const [flashMode, setFlashMode] = useState<CameraProps["flashMode"]>("off");
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const takePicture = async () => {
    if (photoUris.length < 8) {
      const photo = await cameraRef.current?.takePictureAsync({
        flashMode: flashMode,
      });
      if (photo) {
        setCurrentPhoto(photo.uri);
        setShowPreview(true);
      }
    } else {
      Alert.alert("Limit Reached", "You've reached the limit of 8 photos.");
    }
  };

  const savePhoto = async (photoUri: string) => {
    const fileUri = `${FileSystem.documentDirectory}${new Date().getTime()}.jpg`;
    await FileSystem.moveAsync({
      from: photoUri,
      to: fileUri,
    });
    setPhotoUris((prev) => [...prev, fileUri]); // Add new photo to the list
  };

  const confirmPhoto = async () => {
    if (currentPhoto) {
      await savePhoto(currentPhoto);
      setCurrentPhoto(null);
      setShowPreview(false);
    }
  };

  const retakePhoto = () => {
    setShowPreview(false); // Close the preview
    setCurrentPhoto(null); // Reset the current photo
  };

  const handleGalleryImageSelect = (uri: string, index: number) => {
    setCurrentPhoto(uri);
    setSelectedPhotoIndex(index);
    setConfirmModalVisible(true); // Show the modal for delete/keep
  };

  const deletePhoto = () => {
    if (selectedPhotoIndex !== null) {
      setPhotoUris((prev) => prev.filter((_, index) => index !== selectedPhotoIndex)); // Remove the selected photo
    }
    setConfirmModalVisible(false);
    setCurrentPhoto(null);
    setSelectedPhotoIndex(null); // Reset the index after deleting
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          ref={cameraRef}
          flashMode={flashMode}
        />
      </View>

      <View style={styles.controlsContainer}>
        <Text style={styles.counterText}>
          Photos Taken: {photoUris.length} / 8
        </Text>
        <TouchableOpacity
          style={styles.flashButton}
          onPress={() => setFlashMode(prev => (prev === "off" ? "on" : "off"))}
        >
          <Text style={styles.buttonText}>
            {flashMode === "off" ? "Flash Off" : "Flash On"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.takePictureButton}
          onPress={takePicture}
        >
          <Text style={styles.buttonText}>Take Picture</Text>
        </TouchableOpacity>
      </View>

      {/* Show preview for newly taken photos */}
      {showPreview && currentPhoto && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: currentPhoto }} style={styles.previewImage} />
          <View style={styles.previewButtonsContainer}>
            <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={confirmPhoto}>
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Gallery Section */}
      <View style={styles.galleryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {photoUris.map((uri, index) => (
            <TouchableOpacity key={index} onPress={() => handleGalleryImageSelect(uri, index)}>
              <Image source={{ uri }} style={styles.galleryImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Modal for gallery image options */}
      <Modal visible={confirmModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Options</Text>
          {currentPhoto && (
            <Image source={{ uri: currentPhoto }} style={styles.previewImage} />
          )}
          <TouchableOpacity style={styles.deleteButton} onPress={deletePhoto}>
            <Text style={styles.buttonText}>Delete Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={() => setConfirmModalVisible(false)}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  counterText: {
    fontSize: 18,
    textAlign: "center",
    marginVertical: 10,
  },
  flashButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 10,
    padding: 10,
    alignSelf: 'center',
    marginBottom: 10,
  },
  takePictureButton: {
    backgroundColor: '#ffcc00',
    borderRadius: 50,
    height: 70,
    width: 70,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  previewContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  previewImage: {
    width: '100%',
    height: '60%',
    resizeMode: 'cover',
  },
  previewButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  confirmButton: {
    backgroundColor: '#28a745',
    borderRadius: 10,
    padding: 10,
  },
  retakeButton: {
    backgroundColor: '#ffc107',
    borderRadius: 10,
    padding: 10,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    marginBottom: 20,
  },
  permissionText: {
    textAlign: "center",
    color: "#fff",
  },
  galleryContainer: {
    flexDirection: "row",
    marginTop: 10,
    padding: 10,
  },
  galleryImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 10,
  },
  closeButton: {
    backgroundColor: '#007bff',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
});
