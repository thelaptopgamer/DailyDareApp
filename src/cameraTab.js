//src/cameraTab.js
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { Camera } from 'expo-camera'; 

export default function CameraScreen() {
    const[hasPermission, setHasPermission] = useState(null);
    const[cameraRef, setCameraRef] = useState(null);

    
    useEffect(() => {
        (async ()=> {
            // Check if Camera object is available before trying to call its method
            if (Camera) { 
                const {status} = await Camera.requestCameraPermissionsAsync();
                setHasPermission(status === 'granted');
            }
        })();
    },[]
    );


    const handlePicture = async () => {
        if(cameraRef) {
            
            let photo = await cameraRef.takePictureAsync(); 
            Alert.alert("Photo Taken!", photo.uri);
        }
    };

   
    if(hasPermission === null){
        return <View style={styles.container}><Text>Requesting camera permission...</Text></View>
    }
    if(hasPermission === false){
        return <View style={styles.container}><Text>No access to camera!</Text></View>
    }

return (
        <View style={styles.container}>
            <Camera
                style={styles.camera}
                
                type={Camera.Constants.Type.back} 
                ref={ref => setCameraRef(ref)}
                >
                    <View style={styles.buttonContainer}>
                        <Button 
                            title="TAKE PHOTO"
                            onPress={handlePicture}
                            />
                    </View>
                </Camera>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        flex: 1,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        margin: 20,
        justifyContent: 'center',
        alignItems: 'flex-end', 
    },
});