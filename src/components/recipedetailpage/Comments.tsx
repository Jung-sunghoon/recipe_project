import { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import {
	collection,
	getDocs,
	addDoc,
	updateDoc,
	deleteDoc,
	doc,
	DocumentData,
	Timestamp,
	orderBy,
	query,
} from 'firebase/firestore';
import CustomButton, { ButtonType } from '../custombutton/CustomButton';
import styled from '../../pages/recipedetail/RecipeDetail.module.css';
import { Pagination } from 'antd';
// import { AuthContextProps } from '../../context/AuthContext';

interface CommentsProps {
	recipeId: string;
	recipeAuthor: string | undefined;
	users: any;
}

type TextAreaEvent = React.ChangeEvent<HTMLTextAreaElement>;

const Comments: React.FC<CommentsProps> = ({
	recipeId,
	recipeAuthor,
	users,
}) => {
	const [comments, setComments] = useState<DocumentData[]>([]);
	const [newComment, setNewComment] = useState<string>('');
	const [countNewComment, setCountNewComment] = useState<number>(0);

	// 현재 수정중인 상태를 관리 - 초기 값은 수정중이 아니기 때문에 null을 넣어줌
	// 수정할때 필드를 생성해주기 위한 상태 관리
	const [editingCommentId, setEditngCommentId] = useState<string | null>(null);
	const [editedComment, setEditedComment] = useState<string>('');
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [commentsPerPage] = useState<number>(5);

	// 댓글 불러오기
	const getComments = async () => {
		const commentsCollection = collection(db, 'recipes', recipeId, 'comment');
		const sortComment = query(
			commentsCollection,
			orderBy('comment_create_time', 'desc')
		);
		const commentSnapshot = await getDocs(sortComment);
		const commentList = commentSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));
		setComments(commentList);
	};

	useEffect(() => {
		getComments();
	}, []);

	// 댓글 작성일 변환
	const formatDate = (timestamp: Timestamp) => {
		const date = timestamp.toDate();
		return date.toLocaleString();
	};

	// 댓글 수정하기
	const updateComment = async (id: string) => {
		const commnetDoc = doc(db, 'recipes', recipeId, 'comment', id);
		await updateDoc(commnetDoc, {
			comment_description: editedComment,
			comment_update_time: new Date(),
			isEdited: true,
		});
		setEditngCommentId(null);
		getComments();
	};

	// 댓글 삭제하기
	const deleteComment = async (id: string) => {
		const commentDoc = doc(db, 'recipes', recipeId, 'comment', id);
		await deleteDoc(commentDoc);
		getComments();
	};

	// 댓글 등록하기
	const addComment = async () => {
		if (users.user === null) {
			alert('로그인 후 이용해주세요 :)');
			setNewComment('');
			return;
		}

		if (newComment.trim()) {
			try {
				await addDoc(collection(db, 'recipes', recipeId, 'comment'), {
					comment_description: newComment,
					user_nickname: users.nickname,
					comment_create_time: new Date(),
				});

				setNewComment('');
				getComments();
			} catch (eorror) {
				console.error('오류입니다.');
			}
		} else {
			alert('댓글을 입력해주세요!');
		}
	};

	const countCommentHandler = (e: TextAreaEvent) => {
		const newCommentLength = e.target.value.length;
		setCountNewComment(newCommentLength);
		if (newCommentLength > 300) {
			alert('댓글은 300자 내로 작성해주세요');
		}
	};

	// 페이지 변경 처리
	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	// 페이지당 댓글 계산
	const indexOfLastComment = currentPage * commentsPerPage;
	const indexOfFirstComment = indexOfLastComment - commentsPerPage;
	const currentComments = comments.slice(
		indexOfFirstComment,
		indexOfLastComment
	);

	return (
		<>
			<h3>댓글 | Comment</h3>
			<div className={styled.commentInput}>
				<label htmlFor="comment">
					<textarea
						id="comment"
						value={newComment}
						maxLength={300}
						onChange={(e) => [
							setNewComment(e.target.value),
							countCommentHandler(e),
						]}
						onClick={() => {
							if (users.user === null) alert('로그인 후 이용해주세요 :)');
						}}
						readOnly={users.user === null}
						placeholder={
							users.user === null
								? '로그인 후 작성 가능합니다.'
								: `특별한 레시피를 남겨준 ${recipeAuthor} 님에게 따뜻한 댓글을 남겨주세요 ♥`
						}
					/>
					<p className={styled.countComment}>{countNewComment}/300자</p>
				</label>

				<button
					style={{
						cursor: users.user === null ? 'not-allowed' : 'pointer',
					}}
					onClick={addComment}
					className={styled.commentBtn}
				>
					등록
				</button>
			</div>

			<section className={styled.commentList}>
				<h3 className={styled.srOnly}>댓글 리스트</h3>
				<div>
					{currentComments.length > 0 ? (
						<>
							{currentComments.map((comment) => (
								<div key={comment.id} className={styled.commentBlock}>
									<ul className={styled.commentWriterInfo}>
										<li>{comment.user_nickname}</li>
										<li>
											{comment.comment_update_time
												? formatDate(comment.comment_update_time)
												: formatDate(comment.comment_create_time)}

											{comment.isEdited && <span> 수정됨 </span>}
										</li>
									</ul>

									{editingCommentId === comment.id ? (
										<>
											<textarea
												value={editedComment}
												onChange={(e) => setEditedComment(e.target.value)}
											/>
											<div className={styled.editingSettingBtn}>
												<CustomButton
													btnType={ButtonType.Edit}
													color="orange"
													shape="rad30"
													onClick={() => updateComment(comment.id)}
												>
													저장
												</CustomButton>
												<CustomButton
													btnType={ButtonType.Delete}
													color="white"
													shape="rad30"
													onClick={() => setEditngCommentId(null)}
												>
													취소
												</CustomButton>
											</div>
										</>
									) : (
										<>
											<p>{comment.comment_description}</p>

											{users.nickname === comment.user_nickname && (
												<div className={styled.commentSettingsBtn}>
													<CustomButton
														btnType={ButtonType.Edit}
														color="orange"
														shape="rad30"
														onClick={() => {
															setEditngCommentId(comment.id);
															setEditedComment(comment.comment_description);
														}}
													>
														수정
													</CustomButton>
													<CustomButton
														btnType={ButtonType.Delete}
														color="white"
														shape="rad30"
														onClick={() => deleteComment(comment.id)}
													>
														삭제
													</CustomButton>
												</div>
											)}
										</>
									)}
								</div>
							))}
							<Pagination
								current={currentPage}
								pageSize={commentsPerPage}
								total={comments.length}
								onChange={handlePageChange}
								className={styled.pagination_custom}
							/>
						</>
					) : (
						<p className={styled.emptyComment}>
							{' '}
							아직 등록된 댓글이 없습니다.{' '}
						</p>
					)}
				</div>
			</section>
		</>
	);
};

export default Comments;
