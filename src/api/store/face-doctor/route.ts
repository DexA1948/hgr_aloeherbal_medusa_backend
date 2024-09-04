import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";

// Define an interface for the expected request body
interface FaceDoctorRequestBody {
    photo: string;
}

const sampleerrorresponse = {
    "time_used": 525,
    "error_message": "IMAGE_DOWNLOAD_TIMEOUT",
    "request_id": "1470378968,c6f50ec6-49bd-4838-9923-11db04c40f8d"
}


const sampleresponse = {
    "image_reset": "NTyDKpmLM7RklVcRyv2xPA==",
    "request_id": "1528687092,efbe87f7-6c0f-4754-b108-afe8f42abe17",
    "time_used": 666,
    "face_rectangle": {
        "top": 1,
        "left": 1,
        "width": 1,
        "height": 1
    },
    "result": {
        "left_eyelids": {
            "value": "0",
            "confidence": 0.89
        },
        "right_eyelids": {
            "value": "0",
            "confidence": 0.89
        },
        "eye_pouch": {
            "value": "0",
            "confidence": 0.89
        },
        "dark_circle": {
            "value": "0",
            "confidence": 0.89
        },
        "forehead_wrinkle": {
            "value": "0",
            "confidence": 0.89
        },
        "crows_feet": {
            "value": "0",
            "confidence": 0.89
        },
        "eye_finelines": {
            "value": "0",
            "confidence": 0.89
        },
        "glabella_wrinkle": {
            "value": "0",
            "confidence": 0.89
        },
        "nasolabial_fold": {
            "value": "0",
            "confidence": 0.89
        },
        "skin_type": 0,
        "details": {
            "0": {
                "value": 1,
                "confidence": 0.89
            },
            "1": {
                "value": 1,
                "confidence": 0.89
            },
            "2": {
                "value": 0,
                "confidence": 0.01
            },
            "3": {
                "value": 0,
                "confidence": 0.01
            }
        },
        "pores_forehead": {
            "value": "0",
            "confidence": 1
        },
        "pores_left_cheek": {
            "value": "0",
            "confidence": 1
        },
        "pores_right_cheek": {
            "value": "0",
            "confidence": 1
        },
        "pores_jaw": {
            "value": "0",
            "confidence": 1
        },
        "blackhead": {
            "value": "0",
            "confidence": 1
        },
        "acne": {
            "value": "0",
            "confidence": 1
        },
        "mole": {
            "value": "0",
            "confidence": 1
        },
        "skin_spot": {
            "value": "0",
            "confidence": 1
        }
    }
}

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> => {
    // Assert that req.body is of type FaceDoctorRequestBody
    const { photo } = req.body as FaceDoctorRequestBody;

    if (!photo) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    try {
        // Create a FormData object
        const formData = new FormData();

        // Append the API key, secret, and base64 image string
        formData.append('api_key', process.env.FACE_PLUS_API_KEY);
        formData.append('api_secret', process.env.FACE_PLUS_API_SECRET);
        formData.append('image_base64', photo); // Your captured image in Base64

        // Send the POST request with multipart/form-data content type
        const response = await fetch('https://api-us.faceplusplus.com/facepp/v1/skinanalyze', {
            method: 'POST',
            body: formData // Use FormData directly as the body
        });

        // Handle the response
        console.log("FACEPLUSPLUS API CALL");
        const data = await response.json();
        // console.log(data);
        res.status(200).json(data);  // Send response back

    } catch (error) {
        console.log("FACEPLUSPLUS API CALL Error");
        // console.log(error);
        res.status(500).json({ error: error.message });
    }
};

export const GET = (
    req: MedusaRequest,
    res: MedusaResponse
): void => {
    res.json({
        message: "Please use POST to send an inquiry.",
    });
};
