import { projectId, publicAnonKey } from './supabase/info';

// WebRTC Configuration with STUN servers for NAT traversal
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};

export interface WebRTCBroadcaster {
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  cleanup: () => void;
}

export interface WebRTCViewer {
  peerConnection: RTCPeerConnection;
  cleanup: () => void;
}

/**
 * Create a WebRTC broadcaster (for the person going live)
 */
export async function createBroadcaster(
  sessionId: string,
  localStream: MediaStream,
  authToken: string
): Promise<WebRTCBroadcaster> {
  const peerConnection = new RTCPeerConnection(rtcConfig);
  let dataChannel: RTCDataChannel | null = null;

  try {
    console.log('🎥 Starting broadcaster setup for session:', sessionId);
    console.log('📹 Local stream tracks:', {
      video: localStream.getVideoTracks().length,
      audio: localStream.getAudioTracks().length
    });

    // Add local stream tracks to peer connection
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
      console.log(`➕ Added ${track.kind} track to peer connection`);
    });

    // Create data channel for metadata
    dataChannel = peerConnection.createDataChannel('broadcast');
    console.log('📡 Data channel created');
    
    // Create offer
    console.log('🔄 Creating WebRTC offer...');
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log('✅ Local description set');

    // Wait for ICE gathering to complete
    console.log('🧊 Waiting for ICE gathering to complete...');
    await new Promise<void>((resolve) => {
      if (peerConnection.iceGatheringState === 'complete') {
        console.log('✅ ICE gathering already complete');
        resolve();
      } else {
        const checkState = () => {
          console.log('🧊 ICE gathering state:', peerConnection.iceGatheringState);
          if (peerConnection.iceGatheringState === 'complete') {
            peerConnection.removeEventListener('icegatheringstatechange', checkState);
            console.log('✅ ICE gathering complete');
            resolve();
          }
        };
        peerConnection.addEventListener('icegatheringstatechange', checkState);
      }
    });

    // Send offer to signaling server
    console.log('📤 Sending offer to signaling server...');
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/live/${sessionId}/offer`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          offer: peerConnection.localDescription
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to send offer. Status:', response.status, 'Response:', errorText);
      throw new Error(`Failed to send offer to server: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Broadcaster offer sent to server successfully:', result);
    console.log('🎯 Viewers can now connect to session:', sessionId);

    // Poll for viewer answers
    const answerInterval = setInterval(async () => {
      try {
        const answersResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/live/${sessionId}/answers`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }
        );

        if (answersResponse.ok) {
          const { answers } = await answersResponse.json();
          
          for (const answerData of answers) {
            const answer = answerData.answer;
            if (answer && peerConnection.signalingState === 'have-local-offer') {
              await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
              console.log('✅ Set remote description from viewer answer');
            }
          }
        }
      } catch (error) {
        console.error('Error polling for answers:', error);
      }
    }, 2000);

    // Handle ICE candidates
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/live/${sessionId}/ice/broadcaster`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                candidate: event.candidate
              })
            }
          );
        } catch (error) {
          console.error('Error sending ICE candidate:', error);
        }
      }
    };

    // Cleanup function
    const cleanup = () => {
      clearInterval(answerInterval);
      dataChannel?.close();
      peerConnection.close();
    };

    return {
      peerConnection,
      dataChannel,
      cleanup
    };
  } catch (error) {
    peerConnection.close();
    throw error;
  }
}

/**
 * Create a WebRTC viewer (for people watching the live stream)
 */
export async function createViewer(
  sessionId: string,
  viewerId: string,
  authToken: string,
  onRemoteStream: (stream: MediaStream) => void
): Promise<WebRTCViewer> {
  const peerConnection = new RTCPeerConnection(rtcConfig);

  try {
    // Get offer from signaling server with retry logic
    console.log('Fetching WebRTC offer from broadcaster...');
    let offer;
    let retries = 0;
    const maxRetries = 25; // Increased to give broadcaster more time to set up
    
    while (retries < maxRetries) {
      // First check if the session is still active and if WebRTC is ready
      try {
        const sessionCheckResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/live/${sessionId}`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }
        );

        if (sessionCheckResponse.ok) {
          const sessionData = await sessionCheckResponse.json();
          
          console.log('📊 Session status:', {
            isActive: sessionData.isActive,
            webrtcReady: sessionData.webrtcReady,
            attempt: retries + 1
          });
          
          if (!sessionData.isActive) {
            throw new Error('Live session has ended');
          }
          
          // If broadcaster has NOT marked WebRTC as ready, wait before trying offer
          if (!sessionData.webrtcReady) {
            console.log(`⏳ Broadcaster is still setting up WebRTC... (${retries + 1}/${maxRetries})`);
            retries++;
            const waitTime = Math.min(1500 + (retries * 100), 2500); // Backoff 1.5s to 2.5s
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          console.log('✅ Broadcaster is WebRTC ready, fetching offer...');
        } else if (sessionCheckResponse.status === 404) {
          throw new Error('Live session not found');
        } else {
          console.warn(`Session check returned ${sessionCheckResponse.status}, will try offer anyway...`);
        }
      } catch (sessionError) {
        if (sessionError instanceof Error && 
            (sessionError.message.includes('Live session has ended') || 
             sessionError.message.includes('Live session not found'))) {
          throw sessionError;
        }
        console.error('Error checking session status:', sessionError);
        // Continue to try getting the offer anyway
      }

      // Try to get the offer
      const offerResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/live/${sessionId}/offer`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      if (offerResponse.ok) {
        const data = await offerResponse.json();
        if (data.offer) {
          offer = data.offer;
          console.log('✅ Received WebRTC offer from broadcaster');
          break;
        } else {
          console.log('⚠️ Offer response missing offer data');
        }
      } else {
        console.log(`⚠️ Offer not available yet (status: ${offerResponse.status})`);
      }

      retries++;
      if (retries < maxRetries) {
        const waitTime = Math.min(1200 + (retries * 150), 2500); // Exponential backoff, max 2.5s
        console.log(`Retrying in ${waitTime}ms... (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    if (!offer) {
      throw new Error('Unable to connect to live stream. The broadcaster may still be setting up their camera. Please wait a moment and try refreshing.');
    }

    // Set remote description (broadcaster's offer)
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    // Create answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Wait for ICE gathering to complete
    await new Promise<void>((resolve) => {
      if (peerConnection.iceGatheringState === 'complete') {
        resolve();
      } else {
        const checkState = () => {
          if (peerConnection.iceGatheringState === 'complete') {
            peerConnection.removeEventListener('icegatheringstatechange', checkState);
            resolve();
          }
        };
        peerConnection.addEventListener('icegatheringstatechange', checkState);
      }
    });

    // Send answer to signaling server
    const answerResponse = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/live/${sessionId}/answer/${viewerId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answer: peerConnection.localDescription
        })
      }
    );

    if (!answerResponse.ok) {
      throw new Error('Failed to send answer to server');
    }

    console.log('✅ Viewer answer sent to server');

    // Handle incoming remote stream
    peerConnection.ontrack = (event) => {
      console.log('📹 Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        onRemoteStream(event.streams[0]);
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/live/${sessionId}/ice/${viewerId}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                candidate: event.candidate
              })
            }
          );
        } catch (error) {
          console.error('Error sending ICE candidate:', error);
        }
      }
    };

    // Poll for ICE candidates from broadcaster
    const candidateInterval = setInterval(async () => {
      try {
        const candidatesResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/live/${sessionId}/ice/broadcaster`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }
        );

        if (candidatesResponse.ok) {
          const { candidates } = await candidatesResponse.json();
          
          for (const candidateData of candidates) {
            const candidate = candidateData.candidate;
            if (candidate) {
              await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
          }
        }
      } catch (error) {
        console.error('Error polling for ICE candidates:', error);
      }
    }, 2000);

    // Cleanup function
    const cleanup = () => {
      clearInterval(candidateInterval);
      peerConnection.close();
    };

    return {
      peerConnection,
      cleanup
    };
  } catch (error) {
    peerConnection.close();
    throw error;
  }
}