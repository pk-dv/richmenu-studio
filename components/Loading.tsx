
const LoadingScreen = () => {
    return (
        <>
            <div>
                <div className="loadingScreen">
                    <div style={{
                        border: `2px solid #f3f3f3`,borderTop: `2px solid #b6b6b6`,
        borderRadius: `50%`,
        width: 40,
        height: 40,
        animation: `spin 1s linear infinite`}}></div>
                </div>
            </div>
        </>
    )
}

export default LoadingScreen;