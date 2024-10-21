import { useState } from 'react';
import { storage } from '../firebase/config'; // Firebase 설정 파일 import
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid'; // UUID import

const useThumbnailImgUpload = () => {
	const [imageUrl, setImageUrl] = useState<string | null>(null);

	const uploadImage = async (file: File) => {
		const uniqueFileName = `${uuidv4()}_${file.name}`; // UUID와 원래 파일명을 조합
		const storageRef = ref(storage, `images/thumbnail/${uniqueFileName}`); // 고유한 파일명으로 경로 설정
		try {
			await uploadBytes(storageRef, file); // 이미지 업로드
			const url = await getDownloadURL(storageRef); // 업로드된 파일의 다운로드 URL 가져오기
			setImageUrl(url); // URL 상태 업데이트
		} catch (error) {
			console.error('Error uploading image: ', error);
		}
	};

	return { imageUrl, uploadImage, setImageUrl };
};

export default useThumbnailImgUpload;
